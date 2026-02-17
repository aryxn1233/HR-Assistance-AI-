import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('dashboard')
    getDashboardMetrics() {
        return this.analyticsService.getDashboardMetrics();
    }
}
