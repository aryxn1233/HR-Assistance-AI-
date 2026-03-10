/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom, Observable, isObservable } from 'rxjs';

@Injectable()
export class CombinedAuthGuard extends AuthGuard(['jwt', 'clerk']) {
  // This guard checks both strategies. Priority is given to local JWTs to prevent algorithm conflicts.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log(
      `[CombinedAuthGuard] Checking auth for: ${request.method} ${request.url}`,
    );
    try {
      const result = super.canActivate(context);
      const finalResult = isObservable(result)
        ? await firstValueFrom(result)
        : await result;

      console.log(
        `[CombinedAuthGuard] Auth success for ${request.url}: ${!!finalResult}`,
      );
      return !!finalResult;
    } catch (err) {
      console.error(
        `[CombinedAuthGuard] Auth FAILED for ${request.url}: ${err.message}`,
      );
      throw err;
    }
  }
}
