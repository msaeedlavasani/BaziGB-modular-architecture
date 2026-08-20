import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private rateLimiter: RateLimiterService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract IP
    const ip = request.ip || 
               request.headers['x-forwarded-for'] || 
               request.connection?.remoteAddress || 
               'unknown';

    // OTP Limit: 5 requests per 60 seconds
    const limit = 5;
    const ttl = 60;

    // Check IP rate limit
    const isIpLimited = this.rateLimiter.isRateLimited(`http:otp:ip:${ip}`, limit, ttl);
    if (isIpLimited) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Check Phone rate limit if available in body
    const phone = request.body?.phone;
    if (phone) {
      const isPhoneLimited = this.rateLimiter.isRateLimited(`http:otp:phone:${phone}`, limit, ttl);
      if (isPhoneLimited) {
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    return true;
  }
}
