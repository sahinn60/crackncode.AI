import { IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  action!: string;

  @IsString()
  subject!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
