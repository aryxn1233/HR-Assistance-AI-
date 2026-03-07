import { Injectable, Logger } from '@nestjs/common';

export interface ActiveInterview {
    interviewId: string;
    candidateName: string;
    jobRole: string;
    startedAt: Date;
    status: string;
}

@Injectable()
export class LiveInterviewService {
    private readonly logger = new Logger(LiveInterviewService.name);

    // In-memory store for currently active interviews
    private activeSessions = new Map<string, ActiveInterview>();

    addActiveInterview(data: ActiveInterview): void {
        this.activeSessions.set(data.interviewId, data);
        this.logger.log(`Added active interview to dashboard: ${data.interviewId} (${data.candidateName})`);
    }

    removeActiveInterview(interviewId: string): void {
        if (this.activeSessions.has(interviewId)) {
            this.activeSessions.delete(interviewId);
            this.logger.log(`Removed active interview from dashboard: ${interviewId}`);
        }
    }

    getActiveInterviews(): ActiveInterview[] {
        // Return active sessions sorted by recency (newest first)
        return Array.from(this.activeSessions.values()).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    }
}
