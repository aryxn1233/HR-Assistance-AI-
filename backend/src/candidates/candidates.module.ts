import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { Candidate } from './candidate.entity';
import { Application } from './application.entity';
import { AIModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { JobsModule } from '../jobs/jobs.module';
import { Job } from '../jobs/job.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Candidate, Application, Job]), AIModule, AuthModule, JobsModule],
    controllers: [CandidatesController],
    providers: [CandidatesService],
    exports: [CandidatesService],
})
export class CandidatesModule { }
