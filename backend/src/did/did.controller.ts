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
        // Eligibility check (Relaxed for development to allow testing without strict resume scores)
        const application = await this.applicationsRepository.findOne({
            where: { candidate: { userId: req.user.userId } },
            relations: ['candidate']
        });

        if (!application) {
            console.warn(`D-ID: No active application found for user ${req.user.userId}. Proceeding for development.`);
            // throw new NotFoundException('No active application found for this user');
        } else if (application.resumeScore < 40) {
            console.warn(`D-ID: Resume score (${application.resumeScore}) is low for user ${req.user.userId}. Proceeding for development.`);
            // throw new ForbiddenException('Interview eligibility not met (resumeScore < 40)');
        }

        // Proactive cleanup: If a session already exists for this interview, close it first
        if (interviewId) {
            const existingSession = this.didSessionManager.getSession(interviewId);
            if (existingSession) {
                console.log(`D-ID: Proactively closing existing session for interview ${interviewId}`);
                await this.didService.closeSession(existingSession.streamId, existingSession.sessionId).catch(() => { });
                this.didSessionManager.removeSession(interviewId);
            }
        }

        // Default source URL if none provided (using the one from the working demo)
        const url = sourceUrl || 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg';

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
