import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumeParserService } from './resume-parser.service';
import { SkillMatchingService } from './skill-matching.service';
import { QuestionGenerationService } from './question-generation.service';
import { InterviewSessionService } from './interview-session.service';
import { GeminiModule } from '../../gemini/gemini.module';
import { Application } from '../../candidates/application.entity';
import { Job } from '../../jobs/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Application, Job]), GeminiModule],
  providers: [
    ResumeParserService,
    SkillMatchingService,
    QuestionGenerationService,
    InterviewSessionService,
  ],
  exports: [
    ResumeParserService,
    SkillMatchingService,
    QuestionGenerationService,
    InterviewSessionService,
  ],
})
export class InterviewQuestionModule {}
