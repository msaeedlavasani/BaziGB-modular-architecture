import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('guest')
  guest(@Body() body: { name?: string }) {
    const name = body?.name || 'مهمان';
    return { token: this.auth.guestToken(name), name };
  }
}
