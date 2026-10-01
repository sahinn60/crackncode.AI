import {
  IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength,
} from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,72}$/;
const PASSWORD_MESSAGE =
  'Password must be 8-72 characters and include uppercase, lowercase, a number, and a special character.';

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @IsOptional() @IsString() @MaxLength(50)  timezone?: string;
  @IsOptional() @IsString() @MaxLength(10)  locale?: string;
}

export class ChangePasswordDto {
  @IsString() @MaxLength(72) currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
