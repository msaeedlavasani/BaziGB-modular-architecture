import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  /** Required only when the account already has a password (email/register
   *  users). Phone-OTP users without a password can set one directly. */
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsString()
  @MinLength(8, { message: 'رمز جدید باید حداقل ۸ کاراکتر باشد' })
  newPassword!: string;
}
