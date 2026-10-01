export interface AIGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  stream?: boolean;
}

export interface AIGenerationResponse {
  output: string;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface AIProvider {
  readonly name: string;
  generate(request: AIGenerationRequest): Promise<AIGenerationResponse>;
  // Reserved for future streaming support
  generateStream?(request: AIGenerationRequest): AsyncIterable<string>;
}
