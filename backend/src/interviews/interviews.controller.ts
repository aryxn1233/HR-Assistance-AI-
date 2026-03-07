import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CombinedAuthGuard } from '../auth/combined-auth.guard';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) { }

  @UseGuards(CombinedAuthGuard)
  @Post()
  create(@Body() body: any) {
    return this.interviewsService.create(body);
  }

  @UseGuards(CombinedAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    console.log(`[ControllerDebug] findOne for ${id}, req.user:`, JSON.stringify(req.user));
    return this.interviewsService.findOne(id, req.user?.userId || req.user?.id || req.user?.sub);
  }

  @UseGuards(CombinedAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.interviewsService.findAll(req.user);
  }

  @UseGuards(CombinedAuthGuard)
  @Post('start-with-app/:applicationId')
  startByApp(@Param('applicationId') applicationId: string, @Request() req) {
    return this.interviewsService.startInterviewByApplication(
      applicationId,
      req.user.userId,
    );
  }

  @UseGuards(CombinedAuthGuard)
  @Post(':id/start')
  startSession(
    @Param('id') id: string,
    @Body('streamId') streamId: string,
    @Body('sessionId') sessionId: string,
  ) {
    return this.interviewsService.startSession(id, streamId, sessionId);
  }

  @UseGuards(CombinedAuthGuard)
  @Post(':id/answer')
  submitAnswer(@Param('id') id: string, @Body('answer') answer: string) {
    return this.interviewsService.submitAnswer(id, answer);
  }

  @UseGuards(CombinedAuthGuard)
  @Post(':id/respeak')
  respeak(@Param('id') id: string) {
    return this.interviewsService.speakCurrentQuestion(id);
  }

  @UseGuards(CombinedAuthGuard)
  @Patch('application/:applicationId/submit-score')
  submitScore(
    @Param('applicationId') applicationId: string,
    @Body('interviewScore') interviewScore: number,
    @Body('feedback') feedback: any,
  ) {
    return this.interviewsService.submitInterviewScore(
      applicationId,
      interviewScore,
      feedback,
    );
  }

  @UseGuards(CombinedAuthGuard)
  @Post(':id/finish')
  finish(@Param('id') id: string) {
    return this.interviewsService.finishSession(id);
  }
}
