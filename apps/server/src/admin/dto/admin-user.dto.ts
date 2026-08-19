import { IsBoolean, IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'نام کاربری باید شامل حروف انگلیسی، اعداد و آندرلاین باشد' })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'فرمت ایمیل نامعتبر است' })
  email?: string;

  @IsOptional()
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره موبایل باید به صورت 09xxxxxxxxx باشد' })
  phone?: string;
}

export class DeactivateUserDto {
  @IsBoolean()
  deactivated!: boolean;
}
