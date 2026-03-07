import { Injectable } from '@nestjs/common';

interface DIdSession {
  sessionId: string;
  streamId: string;
}

@Injectable()
export class DIdSessionManager {
  private sessions = new Map<string, DIdSession>();

  setSession(interviewId: string, session: DIdSession) {
    this.sessions.set(interviewId, session);
  }

  getSession(interviewId: string): DIdSession | undefined {
    return this.sessions.get(interviewId);
  }

  removeSession(interviewId: string) {
    this.sessions.delete(interviewId);
  }
}
