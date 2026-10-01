import { IsBoolean, IsNumber, IsOptional, IsString, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryToolsDto {
  @IsOptional() @IsString()  search?: string;
  @IsOptional() @IsString()  categoryId?: string;
  @IsOptional() @IsString()  categorySlug?: string;
  @IsOptional() @IsString()  @IsIn(['popular', 'newest', 'default']) sort?: string;
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() featured?: boolean;
  @IsOptional() @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : undefined) premium?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() skip?: number;
  @IsOptional() @Type(() => Number) @IsNumber() take?: number;
}

export class CreateToolDto {
  @IsString() name!: string;
  @IsString() slug!: string;
  @IsString() description!: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsString() categoryId!: string;
  @IsOptional() @IsString() iconUrl?: string;
  @IsOptional() @IsBoolean() isPremium?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class UpdateToolDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() iconUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isPremium?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}
