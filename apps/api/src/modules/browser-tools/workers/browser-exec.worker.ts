import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { CreditsService } from '../../credits/credits.service';
import { BrowserSessionService, BROWSER_EXEC_QUEUE } from '../services/browser-session.service';
import { BrowserExecutionStatus, BrowserConnectionStatus } from '@prisma/client';

export interface BrowserExecJobData {
  executionId:   string;
  browserToolId: string;
  userId:        string;
  input:         Record<string, unknown>;
  creditTxId:    string;
  creditCost:    number;
}

@Processor(BROWSER_EXEC_QUEUE, { concurrency: 3 })
export class BrowserExecWorker extends WorkerHost {
  private readonly logger = new Logger(BrowserExecWorker.name);

  constructor(
    private prisma:   PrismaService,
    private sessions: BrowserSessionService,
    private credits:  CreditsService,
  ) {
    super();
  }

  async process(job: Job<BrowserExecJobData>): Promise<void> {
    const { executionId, browserToolId, userId, input, creditTxId, creditCost } = job.data;

    await this.prisma.browserToolExecution.update({
      where: { id: executionId },
      data:  { status: BrowserExecutionStatus.running, startedAt: new Date() },
    });

    let browser: import('playwright').Browser | null = null;
    let context: import('playwright').BrowserContext | null = null;

    try {
      const tool = await this.prisma.browserTool.findFirst({
        where: { id: browserToolId, deletedAt: null },
      });
      if (!tool) throw new Error('TOOL_NOT_FOUND');

      const conn = await this.prisma.browserToolConnection.findUnique({
        where: { browserToolId },
      });
      if (!conn || conn.status !== BrowserConnectionStatus.CONNECTED) {
        throw new Error('CONNECTION_REQUIRED');
      }

      const state = await this.sessions.loadSession(browserToolId);

      const { chromium } = await import('playwright');
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
      context = await browser.newContext({ userAgent: state.userAgent });

      // Restore cookies
      await context.addCookies(state.cookies as any);

      const page = await context.newPage();

      // Restore localStorage
      await page.goto(tool.websiteUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      if (Object.keys(state.localStorage).length > 0) {
        await page.evaluate((ls) => {
          for (const [k, v] of Object.entries(ls)) {
          // @ts-ignore — browser context
            localStorage.setItem(k, v);
          }
        }, state.localStorage);
        await page.reload({ waitUntil: 'domcontentloaded' });
      }

      await job.updateProgress(30);

      // Execute workflow steps from tool's inputSchema
      const schema = tool.inputSchema as Record<string, any>;
      const steps  = schema?.workflowSteps as any[] | undefined;

      let result = '';

      if (steps && steps.length > 0) {
        result = await this.executeWorkflow(page, steps, input, job);
      } else {
        // Default: fill first textarea/input with primary input value and submit
        const primaryValue = Object.values(input)[0] as string ?? '';
        const textarea = page.locator('textarea').first();
        if (await textarea.count() > 0) {
          await textarea.fill(primaryValue);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(3000);
          result = await textarea.inputValue();
        }
      }

      await job.updateProgress(90);

      // Update execution record
      await this.prisma.browserToolExecution.update({
        where: { id: executionId },
        data: {
          status:      BrowserExecutionStatus.completed,
          result,
          completedAt: new Date(),
          creditsUsed: creditCost,
        },
      });

      // Update last used
      await this.prisma.browserToolConnection.update({
        where: { browserToolId },
        data:  { lastUsedAt: new Date() },
      });

      await job.updateProgress(100);
      this.logger.log(`Execution ${executionId} completed`);

    } catch (err: any) {
      this.logger.error(`Execution ${executionId} failed: ${err.message}`);

      const errorCode = this.classifyError(err.message);

      await this.prisma.browserToolExecution.update({
        where: { id: executionId },
        data: {
          status:       BrowserExecutionStatus.failed,
          errorCode,
          errorMessage: this.safeErrorMessage(err.message),
          completedAt:  new Date(),
        },
      });

      // Refund credits on failure
      if (creditTxId && creditCost > 0) {
        await this.credits.rollback(userId, creditCost, creditTxId, errorCode).catch(() => {});
      }

      throw err;
    } finally {
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    }
  }

  private async executeWorkflow(
    page: import('playwright').Page,
    steps: any[],
    input: Record<string, unknown>,
    job: Job,
  ): Promise<string> {
    let result = '';
    const progressStep = 60 / steps.length;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      switch (step.type) {
        case 'NAVIGATE':
          await page.goto(step.url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
          break;

        case 'FILL':
          await page.locator(step.selector).fill(String(input[step.inputKey] ?? step.value ?? ''));
          break;

        case 'CLICK':
          await page.locator(step.selector).click();
          break;

        case 'WAIT_FOR_SELECTOR':
          await page.waitForSelector(step.selector, { timeout: step.timeout ?? 15_000 });
          break;

        case 'WAIT_FOR_TIMEOUT':
          await page.waitForTimeout(step.ms ?? 2000);
          break;

        case 'EXTRACT_TEXT':
          result = await page.locator(step.selector).innerText();
          break;

        case 'EXTRACT_VALUE':
          result = await page.locator(step.selector).inputValue();
          break;

        case 'SELECT':
          await page.locator(step.selector).selectOption(String(input[step.inputKey] ?? step.value ?? ''));
          break;

        case 'PRESS_KEY':
          await page.keyboard.press(step.key);
          break;
      }

      await job.updateProgress(30 + progressStep * (i + 1));
    }

    return result;
  }

  private classifyError(message: string): string {
    if (message.includes('CONNECTION_REQUIRED'))  return 'CONNECTION_REQUIRED';
    if (message.includes('TOOL_NOT_FOUND'))        return 'TOOL_NOT_FOUND';
    if (message.includes('expired'))               return 'BROWSER_SESSION_EXPIRED';
    if (message.includes('timeout'))               return 'TOOL_TIMEOUT';
    if (message.includes('net::ERR'))              return 'TOOL_UNAVAILABLE';
    return 'WORKFLOW_FAILED';
  }

  // Never expose internal stack traces to users
  private safeErrorMessage(message: string): string {
    const safe: Record<string, string> = {
      CONNECTION_REQUIRED:    'Tool account not connected. Please contact support.',
      TOOL_NOT_FOUND:         'Tool not found.',
      BROWSER_SESSION_EXPIRED:'Session expired. Please contact support.',
      TOOL_TIMEOUT:           'Tool took too long to respond. Please try again.',
      TOOL_UNAVAILABLE:       'Tool website is currently unavailable.',
      WORKFLOW_FAILED:        'Tool execution failed. Please try again.',
    };
    const code = this.classifyError(message);
    return safe[code] ?? 'An unexpected error occurred. Please try again.';
  }
}
