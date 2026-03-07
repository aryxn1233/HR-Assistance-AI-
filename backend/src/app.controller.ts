import { Controller, Get, Headers, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { CombinedAuthGuard } from './auth/combined-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Debug endpoint - returns auth header and token info (REMOVE AFTER DEBUGGING)
  @Get('debug/auth-header')
  debugAuthHeader(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      return {
        status: 'NO TOKEN FOUND',
        header: null,
        hint: 'Authorization header is missing from the request',
      };
    }
    const tokenPreview = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7, 30) + '...'
      : 'Not a Bearer token';
    return {
      status: 'TOKEN RECEIVED',
      tokenPreview,
      headerLength: authHeader.length,
      startsWithBearer: authHeader.startsWith('Bearer '),
    };
  }

  // Debug endpoint - tests that the auth guard accepts the token
  @UseGuards(CombinedAuthGuard)
  @Get('debug/auth-test')
  debugAuthTest(@Request() req: any) {
    return { status: 'AUTH SUCCESSFUL', user: req.user };
  }
}
