import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CombinedAuthGuard } from '../auth/combined-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(CombinedAuthGuard)
  @Get('dashboard')
  getDashboardMetrics() {
    return this.analyticsService.getDashboardMetrics();
  }
}
