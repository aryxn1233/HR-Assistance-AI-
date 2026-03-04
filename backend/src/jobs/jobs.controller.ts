import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CombinedAuthGuard } from '../auth/combined-auth.guard';
@Controller('jobs')
export class JobsController {
    constructor(private readonly jobsService: JobsService) { }

    @UseGuards(CombinedAuthGuard)
    @Post()
    create(@Body() createJobDto: any, @Request() req) {
        return this.jobsService.create(createJobDto, req.user.userId);
    }

    @Get()
    findAll() {
        return this.jobsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.jobsService.findOne(id);
    }

    @UseGuards(CombinedAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateJobDto: any) {
        return this.jobsService.update(id, updateJobDto);
    }

    @UseGuards(CombinedAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.jobsService.remove(id, req.user.userId, req.user.role);
    }

    @UseGuards(CombinedAuthGuard)
    @Get(':id/applications')
    getApplications(@Param('id') jobId: string, @Request() req) {
        return this.jobsService.getApplicationsByJob(jobId, req.user.userId);
    }
}
