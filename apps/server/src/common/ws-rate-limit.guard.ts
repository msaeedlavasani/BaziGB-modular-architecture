import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';

@Injectable()
export class WsRateLimitGuard implements CanActivate {
  constructor(private rateLimiter: RateLimiterService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const id = client.id;

    // Socket Limit: 60 actions per 60 seconds
    const limit = 60;
    const ttl = 60;

    const isLimited = this.rateLimiter.isRateLimited(`ws:action:${id}`, limit, ttl);

    if (isLimited) {
      // Per requirements: event error for socket
      client.emit('error', { 
        message: 'Too many actions. Please wait.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
      return false;
    }

    return true;
  }
}
