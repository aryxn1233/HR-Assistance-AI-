import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { verifyToken } from '@clerk/backend';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
    private secretKey: string;
    private authorizedParties: string[];

    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super();
        this.secretKey = configService.get<string>('CLERK_SECRET_KEY') || '';
        this.authorizedParties = [
            'https://hr-assistance-ai.vercel.app',
            'http://localhost:3000',
        ];
    }

    async validate(req: any): Promise<any> {
        const authHeader = req.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No Bearer token provided');
        }

        const token = authHeader.substring(7);

        try {
            const payload = await verifyToken(token, {
                secretKey: this.secretKey,
                authorizedParties: this.authorizedParties,
            });

            if (!payload?.sub) {
                throw new UnauthorizedException('Invalid token payload');
            }

            // Sync the user to our database using userId from Clerk
            const user = await this.authService.syncClerkUser({
                id: payload.sub,
                email: '',
                email_addresses: [],
                first_name: '',
                last_name: '',
                image_url: null,
                public_metadata: (payload as any).publicMetadata || {},
            });

            if (!user) {
                throw new UnauthorizedException('User synchronization failed');
            }

            return {
                userId: user.id,
                username: user.email,
                role: user.role,
            };
        } catch (err) {
            console.error('Clerk token verification failed:', err?.message || err);
            throw new UnauthorizedException('Invalid or expired Clerk token');
        }
    }
}
