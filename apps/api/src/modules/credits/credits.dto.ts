import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AddCreditsDto {
  @IsString()
  userId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  description!: string;
}

export class AdminAdjustDto {
  @IsString()
  userId!: string;

  /** Positive to add, negative to deduct */
  @IsNumber()
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
