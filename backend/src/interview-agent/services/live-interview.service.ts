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
  private instanceId = Math.random().toString(36).substring(7);

  // In-memory store for currently active interviews
  private activeSessions = new Map<string, ActiveInterview>();

  constructor() {
    this.logger.log(`LiveInterviewService initialized (Instance: ${this.instanceId})`);
  }

  addActiveInterview(data: ActiveInterview): void {
    this.activeSessions.set(data.interviewId, data);
    this.logger.log(
      `[${this.instanceId}] Added active interview to dashboard: ${data.interviewId} (${data.candidateName})`,
    );
  }

  removeActiveInterview(interviewId: string): void {
    if (this.activeSessions.has(interviewId)) {
      this.activeSessions.delete(interviewId);
      this.logger.log(
        `Removed active interview from dashboard: ${interviewId}`,
      );
    }
  }

  getActiveInterviews(): ActiveInterview[] {
    const list = Array.from(this.activeSessions.values()).sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
    );
    this.logger.log(`[${this.instanceId}] Fetching active interviews: count=${list.length}`);
    return list;
  }
}
