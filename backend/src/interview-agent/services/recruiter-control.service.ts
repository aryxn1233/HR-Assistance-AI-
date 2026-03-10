/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Interview,
  InterviewStatus,
} from '../../interviews/entities/interview.entity';
import { LiveInterviewGateway } from '../gateways/live-interview.gateway';
import { LiveInterviewService } from './live-interview.service';
import { InterviewsService } from '../../interviews/interviews.service';

@Injectable()
export class RecruiterControlService {
  private readonly logger = new Logger(RecruiterControlService.name);

  constructor(
    @InjectRepository(Interview)
    private interviewsRepository: Repository<Interview>,
    private liveInterviewGateway: LiveInterviewGateway,
    private liveInterviewService: LiveInterviewService,
    @Inject(forwardRef(() => InterviewsService))
    private interviewsService: InterviewsService,
  ) {}

  async terminateInterview(
    interviewId: string,
    recruiterUserId: string,
  ): Promise<Interview> {
    const interview = await this.interviewsRepository.findOne({
      where: { id: interviewId },
      relations: ['job'],
    });

    if (!interview) {
      throw new NotFoundException(`Interview ${interviewId} not found`);
    }

    if (
      [
        'completed',
        'cancelled',
        'failed_interview',
        'terminated_by_recruiter',
      ].includes(interview.status)
    ) {
      throw new BadRequestException(
        `Interview already ended with status: ${interview.status}`,
      );
    }

    // Logic check: Validate recruiter role / permission if needed here (e.g. check if recruiterUserId matches jobId)
    // Assuming recruiter JWT validation is handled cleanly in the Controller Guard

    this.logger.log(`Recruiter manually terminated interview ${interviewId}`);

    // Notify Candidates and Dashboard
    this.liveInterviewGateway.broadcastTermination(
      interviewId,
      'TERMINATED_BY_RECRUITER',
      'The recruiter has ended the interview. Thank you for participating.',
    );

    await this.interviewsService.finishInterview(
      interview,
      'The recruiter has ended the interview. Thank you for participating.',
      InterviewStatus.TERMINATED_BY_RECRUITER,
      'Ended by recruiter',
    );

    return interview;
  }
}
