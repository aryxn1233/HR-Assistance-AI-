import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Interview } from '../interviews/entities/interview.entity';
import { FallbackQuestion } from './entities/fallback-question.entity';

import { OpenAiManagerService } from './services/openai-manager.service';
import { QuestionFallbackService } from './services/question-fallback.service';
import { InterviewSessionService } from './services/interview-session.service';
import { InterviewAgentService } from './services/interview-agent.service';
import { LiveInterviewService } from './services/live-interview.service';
import { RecruiterControlService } from './services/recruiter-control.service';
import { LiveInterviewGateway } from './gateways/live-interview.gateway';
import { InterviewAgentController } from './interview-agent.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Interview, FallbackQuestion]),
        AuthModule
    ],
    controllers: [InterviewAgentController],
    providers: [
        OpenAiManagerService,
        QuestionFallbackService,
        InterviewSessionService,
        InterviewAgentService,
        LiveInterviewService,
        RecruiterControlService,
        LiveInterviewGateway
    ],
    exports: [
        InterviewAgentService,
        LiveInterviewService,
        LiveInterviewGateway
    ]
})
export class InterviewAgentModule { }
