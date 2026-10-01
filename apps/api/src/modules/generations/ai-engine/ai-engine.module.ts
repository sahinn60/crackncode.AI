import { Module } from '@nestjs/common';
import { OpenAIProvider } from './providers/openai.provider';
import { FutureProvider } from './providers/future.provider';
import { AIProviderRouter } from './ai-provider.router';
import { PromptService } from './prompt.service';

@Module({
  providers: [OpenAIProvider, FutureProvider, AIProviderRouter, PromptService],
  exports: [AIProviderRouter, PromptService],
})
export class AIEngineModule {}
