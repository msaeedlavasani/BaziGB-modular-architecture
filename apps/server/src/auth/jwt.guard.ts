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
      // Authorization must use the current database role. A role embedded in
      // an older JWT is authentication history, not current authority.
      const { password: _password, ...currentUser } = user;
      req.user = { ...payload, ...currentUser, role: currentUser.role };
      return true;
    } catch {
      throw new UnauthorizedException('توکن نامعتبر است');
    }
  }
}
