import { IsString, IsOptional, MaxLength, IsDateString } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @MaxLength(64)
  name: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
