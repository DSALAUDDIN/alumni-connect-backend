import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public — skips JWT authentication.
 * Use on auth endpoints, health checks, etc.
 *
 * @example
 * @Public()
 * @Post('login')
 * login() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
