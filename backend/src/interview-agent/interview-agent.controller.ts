import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { CombinedAuthGuard } from '../auth/combined-auth.guard';
import { RecruiterControlService } from './services/recruiter-control.service';
import { InterviewAgentService } from './services/interview-agent.service';
import { LiveInterviewService } from './services/live-interview.service';

@Controller('interview-agent')
@UseGuards(CombinedAuthGuard)
export class InterviewAgentController {
  constructor(
    private readonly recruiterControlService: RecruiterControlService,
    private readonly interviewAgentService: InterviewAgentService,
    private readonly liveInterviewService: LiveInterviewService,
  ) {}

  @Post(':id/terminate')
  async terminateInterview(@Param('id') id: string, @Request() req) {
    // Enforce basic recruiter check. This assumes the JwtAuthGuard extracts user details
    const user = req.user;
    if (!user || user.role !== 'recruiter') {
      throw new ForbiddenException('Only recruiters can terminate interviews');
    }

    return await this.recruiterControlService.terminateInterview(id, user.id);
  }

  // A candidate might call this endpoint to submit an answer
  @Post(':id/answer')
  async processAnswer(@Param('id') id: string, @Request() req) {
    const user = req.user;
    // In a real system, you'd guarantee that the candidate issuing the answer is exactly the owner
    return await this.interviewAgentService.processAnswer(
      id,
      req.body.answer || '',
    );
  }

  @Get('active')
  async getActiveInterviews(@Request() req) {
    const user = req.user;
    if (!user || user.role !== 'recruiter') {
      throw new ForbiddenException(
        'Only recruiters can view active interviews',
      );
    }
    return this.liveInterviewService.getActiveInterviews();
  }
}
