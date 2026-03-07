import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OpenAiManagerService } from './openai-manager.service';
import { QuestionFallbackService } from './question-fallback.service';
import { InterviewSessionService } from './interview-session.service';

@Injectable()
export class InterviewAgentService {
  private readonly logger = new Logger(InterviewAgentService.name);

  constructor(
    private openAiManager: OpenAiManagerService,
    private questionFallback: QuestionFallbackService,
    private sessionService: InterviewSessionService,
  ) {}

  private isSkipResponse(answer: string): boolean {
    if (!answer || answer.trim() === '') return true;

    const lowerAnswer = answer.toLowerCase().trim();
    const skipPhrases = [
      'skip',
      "i don't know",
      'i do not know',
      'no idea',
      'pass',
      'next question',
    ];

    return skipPhrases.some((phrase) => lowerAnswer.includes(phrase));
  }

  async processAnswer(id: string, answer: string): Promise<any> {
    let interview = await this.sessionService.getInterview(id);

    if (
      [
        'completed',
        'cancelled',
        'failed_interview',
        'terminated_by_recruiter',
      ].includes(interview.status)
    ) {
      throw new BadRequestException(
        `Cannot process answer. Interview is in status: ${interview.status}`,
      );
    }

    // Determine the last question asked (if any)
    const transcript = interview.transcript || [];
    const lastQuestion =
      transcript.length > 0 ? transcript[transcript.length - 1].question : null;

    // Skip detection logic
    if (this.isSkipResponse(answer)) {
      const { interview: updatedInterview, terminated } =
        await this.sessionService.incrementSkipCounter(id);
      if (terminated) {
        return {
          status: updatedInterview.status,
          message: 'Interview terminated due to multiple skipped questions.',
        };
      }
    }

    // Add answer to transcript
    if (lastQuestion) {
      interview = await this.sessionService.addTranscriptEntry(
        id,
        lastQuestion,
        answer,
      );
    }

    const nextQuestion = await this.generateNextQuestion(id, interview);
    await this.sessionService.logQuestion(id, nextQuestion);

    return {
      status: interview.status,
      question: nextQuestion,
    };
  }

  private async generateNextQuestion(
    id: string,
    interview: any,
  ): Promise<string> {
    const transcript = interview.transcript || [];
    const jobRole = interview.job?.title || 'Software Engineer';

    if (
      this.openAiManager.isFallbackMode ||
      interview.status === 'ai_fallback_mode'
    ) {
      return await this.questionFallback.getNextFallbackQuestion(
        jobRole,
        interview.currentQuestionIndex,
      );
    }

    const history: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[] = [
      {
        role: 'system',
        content: `You are an AI technical interviewer. Ask one question at a time.
Verify the candidate's last answer. Generate the next logical question to assess their technical knowledge, reasoning ability, and real project experience for a ${jobRole} role.
Do not reveal answers. Do not give hints. Do not ask multiple questions.`,
      },
    ];

    for (const entry of transcript) {
      if (entry.question) {
        history.push({ role: 'assistant', content: entry.question });
      }
      if (entry.answer) {
        history.push({ role: 'user', content: entry.answer });
      }
    }

    const nextQuestion = await this.openAiManager.generateNextQuestion(history);

    if (!nextQuestion) {
      this.logger.warn(
        `Failed to generate question via AI for ${id}. Switching to Fallback Mode.`,
      );
      await this.sessionService.activateFallbackMode(id);
      return await this.questionFallback.getNextFallbackQuestion(
        jobRole,
        interview.currentQuestionIndex,
      );
    }

    return nextQuestion;
  }
}
