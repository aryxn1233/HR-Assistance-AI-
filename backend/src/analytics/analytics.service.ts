import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/job.entity';
import { Candidate } from '../candidates/candidate.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { CacheManagerService } from '../common/cache-manager.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    @InjectRepository(Candidate)
    private candidatesRepository: Repository<Candidate>,
    @InjectRepository(Interview)
    private interviewsRepository: Repository<Interview>,
    private cacheManager: CacheManagerService,
  ) { }

  async getDashboardMetrics() {
    const cacheKey = 'dashboard_metrics';
    const cachedData = this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    const totalCandidates = await this.candidatesRepository.count();
    const activeJobs = await this.jobsRepository.count({
      where: { status: 'Active' },
    });
    const completedInterviews = await this.interviewsRepository.count({
      where: { status: 'completed' as any },
    }); // Standardized to lowercase

    // Average Score optimized via SQL Aggregate function
    const result = await this.interviewsRepository
      .createQueryBuilder('interview')
      .select('AVG(interview.score)', 'avgScore')
      .where('interview.score > 0')
      .getRawOne();

    const averageScore = Math.round(parseFloat(result?.avgScore) || 0);

    const metrics = {
      totalCandidates,
      activeJobs,
      completedInterviews,
      averageScore,
      // Trends (mock for now because we don't have historical snapshots easily without more complex queries)
      trends: {
        candidates: { value: 12, label: 'from last month', positive: true },
        interviews: { value: 8, label: 'from last month', positive: true },
        score: { value: 2, label: 'improvement', positive: true },
        acceptance: { value: 5, label: 'from last month', positive: false },
      },
    };

    // Cache for 5 minutes
    this.cacheManager.set(cacheKey, metrics, 300);

    return metrics;
  }
}
