import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { verifyToken } from '@clerk/backend';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  private secretKey: string;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super();
    this.secretKey = configService.get<string>('CLERK_SECRET_KEY') || '';
  }

  async validate(req: any): Promise<any> {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No Bearer token provided');
    }

    const token = authHeader.substring(7);

    try {
      // Verify the Clerk JWT using the official SDK
      const payload = await verifyToken(token, {
        secretKey: this.secretKey,
        // No authorizedParties restriction - let Clerk handle it
      });

      console.log('Clerk token verified successfully for sub:', payload?.sub);

      if (!payload?.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Sync or find the user in our database
      const user = await this.authService.syncClerkUser({
        id: payload.sub,
        email: (payload as any).email || '',
        email_addresses: [],
        first_name:
          (payload as any).firstName || (payload as any).given_name || '',
        last_name:
          (payload as any).lastName || (payload as any).family_name || '',
        image_url: null,
        public_metadata:
          (payload as any).publicMetadata || (payload as any).metadata || {},
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
      // Log the actual Clerk error for debugging
      const errMessage = err?.message || err?.toString() || 'Unknown error';
      console.error('Clerk token verification failed:', errMessage);
      console.error('CLERK_SECRET_KEY set:', !!this.secretKey);
      throw new UnauthorizedException(
        `Token verification failed: ${errMessage}`,
      );
    }
  }
}
