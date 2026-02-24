import { Controller, Post, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DIdService } from './did.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from '../candidates/application.entity';

@Controller('did')
export class DIdController {
    constructor(
        private readonly didService: DIdService,
        @InjectRepository(Application)
        private applicationsRepository: Repository<Application>,
    ) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('client-key')
    async getClientKey(@Request() req) {
        // Only candidates allowed (check by role or existence of application)
        // Check if user has an eligible application
        const application = await this.applicationsRepository.findOne({
            where: { candidate: { userId: req.user.userId } },
            relations: ['candidate']
        });

        if (!application) {
            throw new NotFoundException('No active application found for this user');
        }

        if (application.resumeScore < 70) {
            throw new ForbiddenException('Interview eligibility not met (resumeScore < 70)');
        }

        return this.didService.getClientKey();
    }
}
