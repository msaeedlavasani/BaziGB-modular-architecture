import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  /** توکن مهمان — ورود بدون ثبت‌نام */
  guestToken(name: string): string {
    const payload = { sub: `p-${Date.now()}`, name };
    return this.jwt.sign(payload);
  }

  verify(token: string): { sub: string; name?: string } {
    return this.jwt.verify(token) as { sub: string; name?: string };
  }
}
