import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';
import { trustedClientAddress } from './client-identity';

@Injectable()
export class WsRateLimitGuard implements CanActivate {
  constructor(private rateLimiter: RateLimiterService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const address = trustedClientAddress(
      client.handshake?.address,
      client.handshake?.headers?.['x-forwarded-for'],
    );

    // The stable network budget survives reconnects. The per-socket burst
    // budget limits one connection without making unrelated clients share the
    // same primary allowance.
    const isLimited =
      this.rateLimiter.isRateLimited(`ws:action:address:${address}`, 60, 60) ||
      this.rateLimiter.isRateLimited(`ws:action:socket:${client.id}`, 20, 10);

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
