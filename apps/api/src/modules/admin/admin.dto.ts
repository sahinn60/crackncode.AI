import {
  IsBoolean, IsInt, IsNumber, IsObject, IsOptional,
  IsString, Max, MaxLength, Min, MinLength,
} from 'class-validator';

export class AdminToolConfigDto {
  @IsOptional() @IsString() systemPrompt?: string;
  @IsOptional() @IsString() userPromptTemplate?: string;
  @IsOptional() @IsObject() inputSchema?: object;
  @IsOptional() @IsString() outputFormat?: string;
  @IsOptional() @IsString() aiProvider?: string;
  @IsOptional() @IsString() aiModel?: string;
  @IsOptional() @IsInt() @Min(1) @Max(32000) maxTokens?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(2) temperature?: number;
  @IsOptional() @IsInt() @Min(0) creditCost?: number;
}

export class AdminCreateToolDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @IsString() @MaxLength(100) slug: string;
  @IsString() @MaxLength(1000) description: string;
  @IsOptional() @IsString() @MaxLength(300) shortDescription?: string;
  @IsString() categoryId: string;
  @IsOptional() @IsString() iconUrl?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isPremium?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() configuration?: AdminToolConfigDto;
}

export class AdminUpdateToolDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() @MaxLength(300) shortDescription?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() iconUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isPremium?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() configuration?: AdminToolConfigDto;
}

export class AdminCreatePlanDto {
  @IsString() @MaxLength(100) name: string;
  @IsString() tier: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) monthlyPriceUsd: number;
  @IsNumber() @Min(0) yearlyPriceUsd: number;
  @IsInt() @Min(0) creditsPerMonth: number;
  @IsOptional() @IsInt() @Min(0) maxGenerations?: number;
  @IsOptional() features?: any;
  @IsOptional() @IsString() stripePriceIdMonthly?: string;
  @IsOptional() @IsString() stripePriceIdYearly?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsInt() @Min(0) apiKeysAllowed?: number;
  @IsOptional() @IsInt() @Min(0) apiRateLimit?: number;
}

export class AdminUpdatePlanDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) monthlyPriceUsd?: number;
  @IsOptional() @IsNumber() @Min(0) yearlyPriceUsd?: number;
  @IsOptional() @IsInt() @Min(0) creditsPerMonth?: number;
  @IsOptional() @IsInt() @Min(0) maxGenerations?: number;
  @IsOptional() features?: any;
  @IsOptional() @IsString() stripePriceIdMonthly?: string;
  @IsOptional() @IsString() stripePriceIdYearly?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsInt() @Min(0) apiKeysAllowed?: number;
  @IsOptional() @IsInt() @Min(0) apiRateLimit?: number;
}

export class AdminChangePlanDto {
  @IsString() planId: string;
}
