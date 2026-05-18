/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom, isObservable } from 'rxjs';

/**
 * CombinedAuthGuard tries strategies sequentially (jwt first, then clerk).
 * If either strategy succeeds, the request is authenticated.
 * This prevents a Clerk JWT from being rejected by the local JWT strategy
 * before the Clerk strategy even gets a chance to validate it.
 */
@Injectable()
export class CombinedAuthGuard extends AuthGuard(['jwt', 'clerk']) {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log(
      `[CombinedAuthGuard] Checking auth for: ${request.method} ${request.url}`,
    );

    // Try JWT strategy first (for legacy email/password login users)
    try {
      const jwtGuard = new (AuthGuard('jwt'))();
      const jwtResult = jwtGuard.canActivate(context);
      const jwtFinalResult = isObservable(jwtResult)
        ? await firstValueFrom(jwtResult)
        : await jwtResult;

      if (jwtFinalResult) {
        console.log(`[CombinedAuthGuard] JWT strategy succeeded for ${request.url}`);
        return true;
      }
    } catch (jwtErr) {
      console.log(
        `[CombinedAuthGuard] JWT strategy failed for ${request.url}: ${(jwtErr as Error).message}`,
      );
    }

    // Fall back to Clerk strategy (for Clerk-authenticated users / recruiters)
    try {
      const clerkGuard = new (AuthGuard('clerk'))();
      const clerkResult = clerkGuard.canActivate(context);
      const clerkFinalResult = isObservable(clerkResult)
        ? await firstValueFrom(clerkResult)
        : await clerkResult;

      if (clerkFinalResult) {
        console.log(`[CombinedAuthGuard] Clerk strategy succeeded for ${request.url}`);
        return true;
      }
    } catch (clerkErr) {
      console.error(
        `[CombinedAuthGuard] Clerk strategy failed for ${request.url}: ${(clerkErr as Error).message}`,
      );
    }

    console.error(`[CombinedAuthGuard] All strategies failed for ${request.url}`);
    throw new UnauthorizedException('Authentication failed: no valid token provided');
  }
}
