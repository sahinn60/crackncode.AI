import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { BrowserSessionService, BROWSER_CONNECT_QUEUE, SessionState } from '../services/browser-session.service';
import { BrowserConnectionStatus } from '@prisma/client';

@Processor(BROWSER_CONNECT_QUEUE)
export class BrowserConnectWorker extends WorkerHost {
  private readonly logger = new Logger(BrowserConnectWorker.name);

  constructor(
    private prisma:   PrismaService,
    private sessions: BrowserSessionService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'connect') return this.handleConnect(job);
    if (job.name === 'verify')  return this.handleVerify(job);
  }

  private async handleConnect(job: Job<{ browserToolId: string; websiteUrl: string; adminUserId: string }>): Promise<void> {
    const { browserToolId, websiteUrl } = job.data;
    this.logger.log(`Starting connect flow for tool ${browserToolId} → ${websiteUrl}`);

    let browser: import('playwright').Browser | null = null;
    let context: import('playwright').BrowserContext | null = null;

    try {
      // Dynamic import — playwright is optional dep, only needed at runtime
      const { chromium } = await import('playwright');

      browser = await chromium.launch({
        headless: false, // Admin must see the browser to log in
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();
      await page.goto(websiteUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      await job.updateProgress(10);
      this.logger.log(`Browser opened for ${websiteUrl} — waiting for admin login`);

      // Wait up to 10 minutes for admin to complete login
      // We detect success by checking if the URL changes away from login-related paths
      const loginTimeout = 10 * 60 * 1000;
      const startTime    = Date.now();

      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const currentUrl = page.url();
            const elapsed    = Date.now() - startTime;

            if (elapsed > loginTimeout) {
              clearInterval(interval);
              reject(new Error('Login timeout — admin did not complete login within 10 minutes'));
              return;
            }

            // Heuristic: if URL no longer contains login/signin/auth keywords, assume logged in
            const loginKeywords = ['login', 'signin', 'sign-in', 'auth', 'oauth', 'sso'];
            const isOnLoginPage = loginKeywords.some((k) => currentUrl.toLowerCase().includes(k));

            if (!isOnLoginPage && currentUrl !== websiteUrl && !currentUrl.includes('about:blank')) {
              clearInterval(interval);
              resolve();
            }
          } catch (err) {
            clearInterval(interval);
            reject(err);
          }
        }, 2000);
      });

      await job.updateProgress(80);

      // Capture session state
      const cookies = await context.cookies();
      const localStorage: Record<string, string> = await page.evaluate(() => {
        const store: Record<string, string> = {};
        // eslint-disable-next-line no-restricted-globals
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — browser context, localStorage is available
        for (let i = 0; i < localStorage.length; i++) {
          // @ts-ignore
          const key = localStorage.key(i);
          // @ts-ignore
          if (key) store[key] = localStorage.getItem(key) ?? '';
        }
        return store;
      });

      const state: SessionState = {
        cookies:      cookies as SessionState['cookies'],
        localStorage,
        userAgent:    await browser.version(),
        capturedAt:   new Date().toISOString(),
      };

      await this.sessions.storeSession(browserToolId, state);
      await job.updateProgress(100);
      this.logger.log(`Session captured and stored for tool ${browserToolId}`);

    } catch (err: any) {
      this.logger.error(`Connect failed for tool ${browserToolId}: ${err.message}`);
      await this.sessions.markError(browserToolId, err.message ?? 'Connection failed');
      throw err;
    } finally {
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    }
  }

  private async handleVerify(job: Job<{ browserToolId: string }>): Promise<void> {
    const { browserToolId } = job.data;

    try {
      const conn = await this.prisma.browserToolConnection.findUnique({
        where:  { browserToolId },
        include: { browserTool: true },
      });

      if (!conn?.encryptedSessionState) return;

      const { chromium } = await import('playwright');
      const state = await this.sessions.loadSession(browserToolId);

      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();

      try {
        await context.addCookies(state.cookies as any);
        const page = await context.newPage();
        const res  = await page.goto(conn.browserTool.websiteUrl, { timeout: 15_000 });

        const isOk = res?.ok() ?? false;
        const url  = page.url();
        const loginKeywords = ['login', 'signin', 'sign-in', 'auth'];
        const redirectedToLogin = loginKeywords.some((k) => url.toLowerCase().includes(k));

        if (!isOk || redirectedToLogin) {
          await this.sessions.markExpired(browserToolId, 'Session verification failed — redirected to login');
        } else {
          await this.prisma.browserToolConnection.update({
            where: { browserToolId },
            data:  { lastVerifiedAt: new Date(), status: BrowserConnectionStatus.CONNECTED },
          });
        }
      } finally {
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
      }
    } catch (err: any) {
      this.logger.error(`Verify failed for ${browserToolId}: ${err.message}`);
      await this.sessions.markError(browserToolId, err.message);
    }
  }
}
