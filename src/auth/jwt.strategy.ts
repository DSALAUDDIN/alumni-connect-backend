import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../core/prisma/prisma.service';

export interface JwtPayload {
    sub: string;   // user ID
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'fallback_secret_change_in_prod',
        });
    }

    /**
     * Called after JWT signature is verified.
     * Return value is attached to req.user.
     */
    async validate(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, firstName: true, lastName: true },
        });
        return user; // req.user = this user object
    }
}
