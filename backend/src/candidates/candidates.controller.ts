import { Controller, Get, Post, Body, UseGuards, Request, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('candidates')
export class CandidatesController {
    constructor(private readonly candidatesService: CandidatesService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('avatar-upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    async uploadAvatar(@UploadedFile() file: any, @Request() req) {
        const port = process.env.PORT || 3003;
        const apiBaseUrl = process.env.API_URL || `http://localhost:${port}`;
        const avatarUrl = `${apiBaseUrl}/uploads/${file.filename}`;

        // Update both User and Candidate for consistency
        await this.candidatesService.update(req.user.userId, { avatarUrl });

        return { avatarUrl };
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('profile')
    updateProfile(@Body() body: any, @Request() req) {
        return this.candidatesService.update(req.user.userId, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    createCandidate(@Body() body: { firstName: string; lastName: string; email: string; resumeText: string }) {
        return this.candidatesService.createCandidateWithUser(body.firstName, body.lastName, body.email, body.resumeText);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    getProfile(@Request() req) {
        return this.candidatesService.findOneByUserId(req.user.userId);
    }


    @UseGuards(AuthGuard('jwt'))
    @Get()
    getAllCandidates() {
        return this.candidatesService.findAll();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('parse-resume')
    async parseResume(@Body() body: { resumeText: string }) {
        return this.candidatesService.parseResume(body.resumeText);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('applications')
    getMyApplications(@Request() req) {
        return this.candidatesService.getMyApplications(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('stats')
    getStats(@Request() req) {
        return this.candidatesService.getStats(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.candidatesService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('apply/:jobId')
    apply(@Param('jobId') jobId: string, @Request() req) {
        return this.candidatesService.applyToJob(req.user.userId, jobId);
    }
}
