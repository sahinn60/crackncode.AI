import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AIProvider, AIGenerationRequest, AIGenerationResponse } from '../interfaces/ai-provider.interface';

const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1';

  constructor(private config: ConfigService) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    if (!key || key === 'sk-placeholder') {
      this.logger.warn('OPENAI_API_KEY is not configured');
    }
    this.apiKey = key ?? '';
  }

  async generate(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const start = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = 1000 * 2 ** (attempt - 1); // 1s, 2s
        this.logger.warn(`OpenAI retry ${attempt}/${MAX_RETRIES} after ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }

      try {
        return await this.callOpenAI(request, start);
      } catch (err) {
        lastError = err as Error;
        // Don't retry on 4xx (bad request, auth) — only on 5xx / network errors
        if (err instanceof InternalServerErrorException) {
          const status = (err as any).status ?? 500;
          if (status >= 400 && status < 500) throw err;
        }
      }
    }

    throw lastError ?? new InternalServerErrorException('AI provider error');
  }

  private async callOpenAI(
    request: AIGenerationRequest,
    start: number,
  ): Promise<AIGenerationResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt },
          ],
          max_tokens: request.maxTokens,
          temperature: request.temperature,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new InternalServerErrorException(`OpenAI request timed out after ${TIMEOUT_MS}ms`);
      }
      throw new InternalServerErrorException('OpenAI network error');
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`OpenAI ${res.status}: ${body}`);
      const err = new InternalServerErrorException('AI provider error') as any;
      err.status = res.status;
      throw err;
    }

    const json = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
      output: json.choices[0]?.message?.content ?? '',
      promptTokens: json.usage.prompt_tokens,
      outputTokens: json.usage.completion_tokens,
      totalTokens: json.usage.total_tokens,
      durationMs: Date.now() - start,
      metadata: { model: request.model, provider: this.name },
    };
  }
}
