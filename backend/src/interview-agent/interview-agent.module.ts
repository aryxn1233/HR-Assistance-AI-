import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Interview } from '../interviews/entities/interview.entity';
import { FallbackQuestion } from './entities/fallback-question.entity';
import { InterviewsModule } from '../interviews/interviews.module';

import { GeminiModule } from '../gemini/gemini.module';
import { QuestionFallbackService } from './services/question-fallback.service';
import { InterviewSessionService } from './services/interview-session.service';
import { InterviewAgentService } from './services/interview-agent.service';
import { LiveInterviewService } from './services/live-interview.service';
import { RecruiterControlService } from './services/recruiter-control.service';
import { LiveInterviewGateway } from './gateways/live-interview.gateway';
import { InterviewAgentController } from './interview-agent.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Interview, FallbackQuestion]),
    AuthModule,
    GeminiModule,
    forwardRef(() => InterviewsModule),
  ],
  controllers: [InterviewAgentController],
  providers: [
    QuestionFallbackService,
    InterviewSessionService,
    InterviewAgentService,
    LiveInterviewService,
    RecruiterControlService,
    LiveInterviewGateway,
  ],
  exports: [InterviewAgentService, LiveInterviewService, LiveInterviewGateway],
})
export class InterviewAgentModule { }
