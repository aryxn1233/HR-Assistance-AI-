import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { Candidate } from './candidate.entity';
import { Application } from './application.entity';
import { CandidateExperience } from './experience.entity';
import { AIModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { JobsModule } from '../jobs/jobs.module';
import { Job } from '../jobs/job.entity';
import { ScoringModule } from '../scoring/scoring.module';

import { Interview } from '../interviews/entities/interview.entity';
import { InterviewQuestionModule } from '../interviews/question-generation/interview-question.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Candidate,
      Application,
      Job,
      Interview,
      CandidateExperience,
    ]),
    AIModule,
    AuthModule,
    JobsModule,
    ScoringModule,
    InterviewQuestionModule,
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
