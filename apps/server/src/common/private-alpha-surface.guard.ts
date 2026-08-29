import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';

/**
 * Private Alpha deliberately does not expose competitive surfaces.
 * A 404 avoids advertising deferred endpoints to unauthenticated callers.
 */
@Injectable()
export class PrivateAlphaSurfaceGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    throw new NotFoundException();
  }
}
