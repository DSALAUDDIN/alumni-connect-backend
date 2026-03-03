import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to specific roles.
 *
 * @example
 * @Roles('ADMIN', 'SUPER_ADMIN')
 * @Get('admin/stats')
 * getStats() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
