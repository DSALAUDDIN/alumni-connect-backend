import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator that extracts the full user object from req.user.
 *
 * @example
 * @Get('me')
 * getMe(@CurrentUser() user: AuthUser) { ... }
 *
 * @example — extract a single field
 * @Get('me')
 * getMe(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
    (field: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        return field ? user?.[field] : user;
    },
);
