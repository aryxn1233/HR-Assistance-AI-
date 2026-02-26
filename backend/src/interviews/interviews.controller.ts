import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('interviews')
export class InterviewsController {
    constructor(private readonly interviewsService: InterviewsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Body() body: any) {
        return this.interviewsService.create(body);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.interviewsService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll(@Request() req) {
        return this.interviewsService.findAll(req.user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('start-with-app/:applicationId')
    startByApp(@Param('applicationId') applicationId: string, @Request() req) {
        return this.interviewsService.startInterviewByApplication(applicationId, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/start')
    startSession(
        @Param('id') id: string,
        @Body('streamId') streamId: string,
        @Body('sessionId') sessionId: string
    ) {
        return this.interviewsService.startSession(id, streamId, sessionId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/answer')
    submitAnswer(@Param('id') id: string, @Body('answer') answer: string) {
        return this.interviewsService.submitAnswer(id, answer);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/respeak')
    respeak(@Param('id') id: string) {
        return this.interviewsService.speakCurrentQuestion(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('application/:applicationId/submit-score')
    submitScore(
        @Param('applicationId') applicationId: string,
        @Body('interviewScore') interviewScore: number,
        @Body('feedback') feedback: any
    ) {
        return this.interviewsService.submitInterviewScore(applicationId, interviewScore, feedback);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/finish')
    finish(@Param('id') id: string) {
        return this.interviewsService.finishSession(id);
    }
}
