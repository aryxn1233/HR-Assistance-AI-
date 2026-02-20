import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/job.entity';
import { Candidate } from '../candidates/candidate.entity';
import { Interview } from '../interviews/entities/interview.entity';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Job)
        private jobsRepository: Repository<Job>,
        @InjectRepository(Candidate)
        private candidatesRepository: Repository<Candidate>,
        @InjectRepository(Interview)
        private interviewsRepository: Repository<Interview>,
    ) { }

    async getDashboardMetrics() {
        const totalCandidates = await this.candidatesRepository.count();
        const activeJobs = await this.jobsRepository.count({ where: { status: 'Active' } });
        const completedInterviews = await this.interviewsRepository.count({ where: { status: 'Completed' as any } }); // Status enum issue?

        // Average Score
        const interviewsWithScore = await this.interviewsRepository
            .createQueryBuilder('interview')
            .where('interview.score > 0')
            .getMany();

        const totalScore = interviewsWithScore.reduce((sum, interview) => sum + interview.score, 0);
        const averageScore = interviewsWithScore.length > 0 ? Math.round(totalScore / interviewsWithScore.length) : 0;

        return {
            totalCandidates,
            activeJobs,
            completedInterviews,
            averageScore,
            // Trends (mock for now because we don't have historical snapshots easily without more complex queries)
            trends: {
                candidates: { value: 12, label: "from last month", positive: true },
                interviews: { value: 8, label: "from last month", positive: true },
                score: { value: 2, label: "improvement", positive: true },
                acceptance: { value: 5, label: "from last month", positive: false }
            }
        };
    }
}
