import { Injectable } from '@nestjs/common';
import type { AIProvider, AIGenerationRequest, AIGenerationResponse } from '../interfaces/ai-provider.interface';

/**
 * Stub for future AI providers (Anthropic, Gemini, Mistral, etc.)
 * Implement `generate()` and register in AIProviderRouter to activate.
 */
@Injectable()
export class FutureProvider implements AIProvider {
  readonly name = 'future';

  async generate(_request: AIGenerationRequest): Promise<AIGenerationResponse> {
    throw new Error('FutureProvider is not implemented yet');
  }
}
