import { IsString, Matches } from 'class-validator';

export class OtpRequestDto {
  // Accept +98 / 0098 / 0 prefixes; normalized to 09xxxxxxxxx in the service.
  @IsString()
  @Matches(/^(\+?98|0)?9\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone!: string;
}
