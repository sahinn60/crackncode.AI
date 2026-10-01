import { Injectable, BadRequestException } from '@nestjs/common';
import { OpenAIProvider } from './providers/openai.provider';
import { FutureProvider } from './providers/future.provider';
import type { AIProvider } from './interfaces/ai-provider.interface';

@Injectable()
export class AIProviderRouter {
  private readonly registry: Map<string, AIProvider>;

  constructor(
    private openai: OpenAIProvider,
    private future: FutureProvider,
  ) {
    this.registry = new Map<string, AIProvider>([
      [this.openai.name, this.openai],
      [this.future.name, this.future],
    ]);
  }

  resolve(providerName: string): AIProvider {
    const provider = this.registry.get(providerName.toLowerCase());
    if (!provider) {
      throw new BadRequestException(`Unknown AI provider: ${providerName}`);
    }
    return provider;
  }
}
