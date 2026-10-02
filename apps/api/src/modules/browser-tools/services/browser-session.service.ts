import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { BrowserEncryptionService } from './browser-encryption.service';
import { BrowserConnectionStatus } from '@prisma/client';

export const BROWSER_CONNECT_QUEUE = 'browser-connect';
export const BROWSER_EXEC_QUEUE    = 'browser-exec';

export interface SessionState {
  cookies:      Array<{ name: string; value: string; domain: string; path: string; secure?: boolean; httpOnly?: boolean; sameSite?: string; expires?: number }>;
  localStorage: Record<string, string>;
  userAgent?:   string;
  capturedAt:   string;
}

@Injectable()
export class BrowserSessionService {
  private readonly logger = new Logger(BrowserSessionService.name);

  constructor(
    private prisma:      PrismaService,
    private encryption:  BrowserEncryptionService,
    @InjectQueue(BROWSER_CONNECT_QUEUE) private connectQueue: Queue,
    @InjectQueue(BROWSER_EXEC_QUEUE)    private execQueue:    Queue,
  ) {}

  /** Initiate admin connect flow — launches Playwright, returns jobId for SSE polling */
  async initiateConnect(browserToolId: string, adminUserId: string): Promise<{ jobId: string }> {
    const tool = await this.prisma.browserTool.findFirst({
      where: { id: browserToolId, deletedAt: null },
    });
    if (!tool) throw new NotFoundException('Browser tool not found');

    // Upsert connection record → CONNECTING
    await this.prisma.browserToolConnection.upsert({
      where:  { browserToolId },
      create: { browserToolId, status: BrowserConnectionStatus.CONNECTING },
      update: { status: BrowserConnectionStatus.CONNECTING, lastError: null },
    });

    const job = await this.connectQueue.add(
      'connect',
      { browserToolId, websiteUrl: tool.websiteUrl, adminUserId },
      { jobId: `connect:${browserToolId}`, removeOnComplete: false, removeOnFail: false },
    );

    this.logger.log(`Connect job ${job.id} queued for tool ${browserToolId}`);
    return { jobId: job.id as string };
  }

  /** Called by worker after admin completes login — stores encrypted session */
  async storeSession(browserToolId: string, state: SessionState): Promise<void> {
    const json = JSON.stringify(state);
    const { ciphertext, version } = this.encryption.encrypt(json);

    await this.prisma.browserToolConnection.update({
      where: { browserToolId },
      data: {
        status:               BrowserConnectionStatus.CONNECTED,
        encryptedSessionState: ciphertext,
        encryptionVersion:    version,
        lastVerifiedAt:       new Date(),
        lastError:            null,
        expiresAt:            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    this.logger.log(`Session stored for tool ${browserToolId}`);
  }

  /** Load and decrypt session — NEVER returns raw state to frontend */
  async loadSession(browserToolId: string): Promise<SessionState> {
    const conn = await this.prisma.browserToolConnection.findUnique({
      where: { browserToolId },
    });

    if (!conn || !conn.encryptedSessionState) {
      throw new BadRequestException('No session available for this tool');
    }

    if (conn.status !== BrowserConnectionStatus.CONNECTED) {
      throw new BadRequestException(`Connection is ${conn.status} — reconnect required`);
    }

    if (conn.expiresAt && conn.expiresAt < new Date()) {
      await this.markExpired(browserToolId, 'Session expired');
      throw new BadRequestException('Session has expired — reconnect required');
    }

    return JSON.parse(this.encryption.decrypt(conn.encryptedSessionState)) as SessionState;
  }

  async markExpired(browserToolId: string, reason: string): Promise<void> {
    await this.prisma.browserToolConnection.update({
      where: { browserToolId },
      data:  { status: BrowserConnectionStatus.EXPIRED, lastError: reason },
    });
  }

  async markError(browserToolId: string, error: string): Promise<void> {
    await this.prisma.browserToolConnection.update({
      where: { browserToolId },
      data:  { status: BrowserConnectionStatus.ERROR, lastError: error },
    });
  }

  async disconnect(browserToolId: string): Promise<void> {
    await this.prisma.browserToolConnection.update({
      where: { browserToolId },
      data: {
        status:               BrowserConnectionStatus.DISCONNECTED,
        encryptedSessionState: null,
        lastError:            null,
      },
    });
  }

  async verify(browserToolId: string): Promise<{ connected: boolean; status: BrowserConnectionStatus }> {
    const conn = await this.prisma.browserToolConnection.findUnique({
      where: { browserToolId },
    });

    if (!conn || !conn.encryptedSessionState) {
      return { connected: false, status: BrowserConnectionStatus.DISCONNECTED };
    }

    if (conn.expiresAt && conn.expiresAt < new Date()) {
      await this.markExpired(browserToolId, 'Session expired during verification');
      return { connected: false, status: BrowserConnectionStatus.EXPIRED };
    }

    // Queue a lightweight verification job
    await this.connectQueue.add(
      'verify',
      { browserToolId },
      { removeOnComplete: true, removeOnFail: false },
    );

    await this.prisma.browserToolConnection.update({
      where: { browserToolId },
      data:  { lastVerifiedAt: new Date() },
    });

    return { connected: conn.status === BrowserConnectionStatus.CONNECTED, status: conn.status };
  }

  /** Safe public status — never includes session data */
  async getConnectionStatus(browserToolId: string) {
    const conn = await this.prisma.browserToolConnection.findUnique({
      where: { browserToolId },
      select: {
        status:         true,
        lastVerifiedAt: true,
        lastUsedAt:     true,
        expiresAt:      true,
        lastError:      true,
        createdAt:      true,
        updatedAt:      true,
        // encryptedSessionState intentionally excluded
      },
    });
    return conn;
  }
}
