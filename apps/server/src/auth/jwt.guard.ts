import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
    try {
      const payload = this.auth.verify(header.slice(7));
      const user = await this.auth.validateUser(payload);
      if (!user) throw new UnauthorizedException('کاربر یافت نشد یا غیرفعال است');
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('توکن نامعتبر است');
    }
  }
}
