import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Job } from '../jobs/job.entity';
import { Candidate } from '../candidates/candidate.entity';
import { Interview } from '../interviews/entities/interview.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Candidate, Interview])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
