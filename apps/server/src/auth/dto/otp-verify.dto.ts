import { IsOptional, IsString, Matches } from 'class-validator';

export class OtpVerifyDto {
  @IsString()
  @Matches(/^(\+?98|0)?9\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'کد باید ۶ رقم باشد' })
  code!: string;

  /** Required only when the phone has no account yet (signup). Latin-only. */
  @IsOptional()
  @IsString()
  username?: string;
}
