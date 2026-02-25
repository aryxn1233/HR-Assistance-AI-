import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { InterviewGateway } from './interview.gateway';
import { Interview } from './entities/interview.entity';
import { InterviewQuestion } from './entities/interview-question.entity';
import { InterviewAnswer } from './entities/interview-answer.entity';
import { InterviewReport } from './entities/interview-report.entity';
import { AIModule } from '../ai/ai.module';
import { GeminiModule } from '../gemini/gemini.module';
import { DIdModule } from '../did/did.module';

import { Application } from '../candidates/application.entity';
import { Candidate } from '../candidates/candidate.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Interview, InterviewQuestion, InterviewAnswer, InterviewReport, Application, Candidate]),
        AIModule,
        GeminiModule,
        DIdModule
    ],
    controllers: [InterviewsController],
    providers: [InterviewsService, InterviewGateway],
    exports: [InterviewsService],
})
export class InterviewsModule { }
