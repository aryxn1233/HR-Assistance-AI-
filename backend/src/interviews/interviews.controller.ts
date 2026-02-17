import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
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
    findAll() {
        return this.interviewsService.findAll();
    }
}
