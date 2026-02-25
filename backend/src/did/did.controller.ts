import { Controller, Post, Body, Param, Delete, Query, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DIdService } from './did.service';
import { DIdSessionManager } from './did-session.manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../candidates/application.entity';

@Controller('did')
export class DIdController {
    constructor(
        private readonly didService: DIdService,
        private readonly didSessionManager: DIdSessionManager,
        @InjectRepository(Application)
        private applicationsRepository: Repository<Application>,
    ) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('session')
    async createSession(
        @Body('source_url') sourceUrl: string,
        @Query('interviewId') interviewId: string,
        @Request() req
    ) {
        // Eligibility check
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

        // Default source URL if none provided (using the alex v2 image mentioned by user)
        const url = sourceUrl || 'https://create-images-results.s3.amazonaws.com/Default_Avatar.png';
        // Note: The user mentioned alex_v2_idle_image.png is in public folder. 
        // For D-ID Streaming API, it needs a PUBLIC URL. 
        // If the user's frontend is locally hosted, D-ID won't be able to reach it.
        // I'll keep the placeholder but the user should ideally provide a public URL or I use a good default.

        const session = await this.didService.createSession(url);

        if (interviewId) {
            this.didSessionManager.setSession(interviewId, {
                sessionId: session.session_id,
                streamId: session.id
            });
        }

        return session;
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('session/:streamId/sdp')
    async startStream(
        @Param('streamId') streamId: string,
        @Body('session_id') sessionId: string,
        @Body('answer') answer: any
    ) {
        return this.didService.startStream(streamId, sessionId, answer);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('session/:streamId/ice')
    async submitIceCandidate(
        @Param('streamId') streamId: string,
        @Body('session_id') sessionId: string,
        @Body('candidate') candidate: any
    ) {
        return this.didService.submitIceCandidate(streamId, sessionId, candidate);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('session/:streamId')
    async closeSession(
        @Param('streamId') streamId: string,
        @Body('session_id') sessionId: string,
        @Query('interviewId') interviewId: string
    ) {
        if (interviewId) {
            this.didSessionManager.removeSession(interviewId);
        }
        return this.didService.closeSession(streamId, sessionId);
    }
}
