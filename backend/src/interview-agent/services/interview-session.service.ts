import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Interview,
  InterviewStatus,
} from '../../interviews/entities/interview.entity';
import { LiveInterviewGateway } from '../gateways/live-interview.gateway';

@Injectable()
export class InterviewSessionService {
  private readonly logger = new Logger(InterviewSessionService.name);

  constructor(
    @InjectRepository(Interview)
    private interviewsRepository: Repository<Interview>,
    private liveInterviewGateway: LiveInterviewGateway,
  ) {}

  async getInterview(id: string): Promise<Interview> {
    const interview = await this.interviewsRepository.findOne({
      where: { id },
      relations: ['job', 'candidate', 'candidate.user'],
    });
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }
    return interview;
  }

  async addTranscriptEntry(
    id: string,
    question: string,
    answer: string,
  ): Promise<Interview> {
    const interview = await this.getInterview(id);
    const transcript = interview.transcript || [];

    transcript.push({
      question,
      answer,
      timestamp: new Date(),
    });

    interview.transcript = transcript;
    interview.currentQuestionIndex += 1;

    await this.interviewsRepository.save(interview);

    // Broadcast to recruiter if observing
    this.liveInterviewGateway.broadcastAnswer(id, question, answer);

    return interview;
  }

  async logQuestion(id: string, question: string): Promise<void> {
    // Broadcast question to recruiter
    this.liveInterviewGateway.broadcastQuestion(id, question);
  }

  async incrementSkipCounter(
    id: string,
  ): Promise<{ interview: Interview; terminated: boolean }> {
    const interview = await this.getInterview(id);
    interview.skipCounter = (interview.skipCounter || 0) + 1;

    const MAX_SKIPS = 2;
    let terminated = false;

    if (interview.skipCounter >= MAX_SKIPS) {
      this.logger.warn(
        `Interview ${id} skipped >= ${MAX_SKIPS} times. Auto-terminating.`,
      );
      interview.status = InterviewStatus.FAILED_INTERVIEW;
      interview.terminationReason = 'Candidate skipped multiple questions';
      interview.endedAt = new Date();
      terminated = true;

      // Notify candidate frontend
      this.liveInterviewGateway.broadcastTermination(
        id,
        'FAILED_INTERVIEW',
        'This interview has ended because multiple questions were skipped.',
      );
      // Notify recruiter dashboard
      this.liveInterviewGateway.broadcastStatus(
        id,
        InterviewStatus.FAILED_INTERVIEW,
      );
    }

    await this.interviewsRepository.save(interview);
    return { interview, terminated };
  }

  async activateFallbackMode(id: string): Promise<void> {
    const interview = await this.getInterview(id);
    if (interview.status !== InterviewStatus.AI_FALLBACK_MODE) {
      interview.status = InterviewStatus.AI_FALLBACK_MODE;
      await this.interviewsRepository.save(interview);
      this.liveInterviewGateway.broadcastStatus(
        id,
        InterviewStatus.AI_FALLBACK_MODE,
      );
      this.logger.log(`Interview ${id} switched to AI_FALLBACK_MODE`);
    }
  }
}
