import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * گارد JWT — برای استفاده روی مسیرهای محافظت‌شده.
 * هدر: Authorization: Bearer <token>
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
    try {
      req.user = this.auth.verify(header.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException('توکن نامعتبر است');
    }
  }
}
