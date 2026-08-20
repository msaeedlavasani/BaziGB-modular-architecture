import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * In-memory rate limiter for single-instance deployments.
 * NOTE: For multi-instance scaling, this must be replaced with a Redis-based store.
 */
@Injectable()
export class RateLimiterService implements OnModuleInit, OnModuleDestroy {
  private store = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  onModuleInit() {
    // Prune expired records every 60 seconds to avoid memory leaks
    this.cleanupInterval = setInterval(() => this.prune(), 60000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Increments the count for a key and checks if it exceeds the limit.
   * @param key Unique identifier (IP, user ID, etc.)
   * @param limit Maximum allowed requests in the window
   * @param ttlSeconds Window duration in seconds
   * @returns true if rate limited, false otherwise
   */
  isRateLimited(key: string, limit: number, ttlSeconds: number): boolean {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + ttlSeconds * 1000,
      });
      return false;
    }

    if (record.count >= limit) {
      return true;
    }

    record.count++;
    return false;
  }

  private prune() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}
