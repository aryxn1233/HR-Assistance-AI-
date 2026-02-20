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
        return this.interviewsService.findAll(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/start')
    startSession(@Param('id') id: string) {
        return this.interviewsService.startSession(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/answer')
    submitAnswer(@Param('id') id: string, @Body('answer') answer: string) {
        return this.interviewsService.submitAnswer(id, answer);
    }
}
