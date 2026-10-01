import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateGenerationDto {
  @IsString()
  toolId!: string;

  @IsObject()
  input!: Record<string, unknown>;

  /** Set to true to enqueue as a background job instead of waiting inline */
  @IsOptional()
  async?: boolean;
}
