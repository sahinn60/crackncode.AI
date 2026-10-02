import {
  IsBoolean, IsInt, IsNumber, IsObject, IsOptional,
  IsString, IsUrl, Max, Min, MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateBrowserToolDto {
  @IsString() @MinLength(2)
  name!: string;

  @IsString() @MinLength(2)
  slug!: string;

  @IsString() @MinLength(10)
  description!: string;

  @IsString()
  websiteUrl!: string;

  @IsString()
  categoryId!: string;

  @IsOptional() @IsString()
  imageUrl?: string;

  @IsOptional() @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsString()
  ctaText?: string;

  @IsOptional() @IsBoolean()
  featured?: boolean;

  @IsOptional() @IsInt() @Min(0)
  @Type(() => Number)
  displayOrder?: number;

  @IsOptional() @IsInt() @Min(1) @Max(100)
  @Type(() => Number)
  creditCost?: number;

  @IsOptional() @IsObject()
  inputSchema?: Record<string, unknown>;
}

export class UpdateBrowserToolDto {
  @IsOptional() @IsString() @MinLength(2)
  name?: string;

  @IsOptional() @IsString() @MinLength(10)
  description?: string;

  @IsOptional() @IsString()
  websiteUrl?: string;

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsString()
  imageUrl?: string;

  @IsOptional() @IsNumber() @Type(() => Number)
  price?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsString()
  ctaText?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsBoolean()
  featured?: boolean;

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  displayOrder?: number;

  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  creditCost?: number;

  @IsOptional() @IsObject()
  inputSchema?: Record<string, unknown>;
}

export class ExecuteBrowserToolDto {
  @IsObject()
  input!: Record<string, unknown>;

  @IsOptional() @IsString()
  idempotencyKey?: string;
}

export class QueryBrowserToolsDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  skip?: number;

  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  take?: number;
}
