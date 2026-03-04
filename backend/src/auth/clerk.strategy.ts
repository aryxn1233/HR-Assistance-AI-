import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { passportJwtSecret } from 'jwks-rsa';

import { AuthService } from './auth.service';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
    constructor(
        configService: ConfigService,
        private authService: AuthService,
    ) {
        // Clerk Publishable Key usually contains the Issuer URL implicitly
        const clerkIssuer = configService.get<string>('CLERK_ISSUER_URL') || `https://dynamic-lamprey-28.clerk.accounts.dev`;

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            issuer: clerkIssuer,
            algorithms: ['RS256'],
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${clerkIssuer}/.well-known/jwks.json`,
            }),
        });
    }

    async validate(payload: any) {
        const user = await this.authService.syncClerkUser(payload);

        if (!user) {
            throw new UnauthorizedException('User synchronization failed');
        }

        return {
            userId: user.id,
            username: user.email,
            role: user.role
        };
    }
}
