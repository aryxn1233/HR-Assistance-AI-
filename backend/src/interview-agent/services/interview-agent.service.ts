/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GeminiService } from '../../gemini/gemini.service';
import { QuestionFallbackService } from './question-fallback.service';
import { InterviewSessionService } from './interview-session.service';

@Injectable()
export class InterviewAgentService {
  private readonly logger = new Logger(InterviewAgentService.name);

  constructor(
    private geminiService: GeminiService,
    private questionFallback: QuestionFallbackService,
    private sessionService: InterviewSessionService,
  ) { }

  private isSkipResponse(answer: string): boolean {
    if (!answer || answer.trim() === '') return false;

    const lowerAnswer = answer.toLowerCase().trim();
    const skipRegex =
      /\b(skip|i don't know|i do not know|no idea|pass|next question)\b/i;

    // A skip response is usually a short command, not a full paragraph that happens to contain a skip phrase.
    return skipRegex.test(lowerAnswer) && lowerAnswer.length < 40;
  }

  async processAnswer(id: string, answer: string): Promise<any> {
    const interview = await this.sessionService.getInterview(id);

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

    // Note: The candidate's answer was already appended to `interview.transcript`
    // by InterviewsService before calling this method.

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

    if (interview.status === 'ai_fallback_mode') {
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
      if (entry.speaker === 'AI') {
        history.push({ role: 'assistant', content: entry.message });
      } else if (entry.speaker === 'Candidate') {
        history.push({ role: 'user', content: entry.message });
      } else {
        // Fallback for previous legacy transcript format
        if (entry.question) {
          history.push({ role: 'assistant', content: entry.question });
        }
        if (entry.answer) {
          history.push({ role: 'user', content: entry.answer });
        }
      }
    }

    // Check for "Stop/Exit/Finish" intent in the last answer
    const lastAnswer = transcript.length > 0 ? transcript[transcript.length - 1].message : '';
    const stopRegex = /\b(stop|end|finish|exit|close|thank you|that's all|no more questions)\b/i;
    const isExitIntent = stopRegex.test(lastAnswer || '') && (lastAnswer || '').length < 50;

    // CAP the interview at 16 questions (8 exchanges) if AI is struggling or fallback is active
    const MAX_QUESTIONS = 16;
    if (interview.currentQuestionIndex >= MAX_QUESTIONS || isExitIntent) {
      this.logger.log(`Closing interview session ${id} (Index: ${interview.currentQuestionIndex}, ExitIntent: ${isExitIntent})`);
      interview.status = 'completed'; // Local update for the returned result
      return "Thank you for sharing all those details. We've reached the end of our scheduled time. I truly appreciate you taking the time to speak with me today. Our team will review your responses and get back to you soon. Have a great day!";
    }

    const nextQuestion = await this.geminiService.generateNextQuestion(history);

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
