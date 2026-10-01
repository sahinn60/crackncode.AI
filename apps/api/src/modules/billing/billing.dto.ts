import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  planId!: string;

  @IsEnum(['monthly', 'yearly'])
  interval!: 'monthly' | 'yearly';
}

export class CreatePortalDto {
  @IsOptional()
  @IsString()
  returnUrl?: string;
}
