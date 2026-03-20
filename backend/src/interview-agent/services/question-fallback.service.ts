/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FallbackQuestion,
  FallbackQuestionCategory,
} from '../entities/fallback-question.entity';

@Injectable()
export class QuestionFallbackService {
  private readonly logger = new Logger(QuestionFallbackService.name);

  constructor(
    @InjectRepository(FallbackQuestion)
    private fallbackQuestionsRepo: Repository<FallbackQuestion>,
  ) { }

  async getNextFallbackQuestion(
    jobRole: string,
    currentQuestionIndex: number,
  ): Promise<string> {
    this.logger.log(
      `Fetching stage-aware fallback question for ${jobRole} at index ${currentQuestionIndex}`,
    );

    // 1. Determine Stage
    let category = FallbackQuestionCategory.SKILL;
    if (currentQuestionIndex <= 2) {
      category = FallbackQuestionCategory.EXPERIENCE; // Warmup / Intro
    } else if (currentQuestionIndex <= 10) {
      category = FallbackQuestionCategory.SKILL; // Core Technical
    } else if (currentQuestionIndex <= 14) {
      category = FallbackQuestionCategory.PROJECT; // Scenario / Behavioral
    } else {
      return "We've covered a lot of ground today. Thanks for you time now you can end the interview .";
    }

    // 2. Try to find matching questions in DB
    let questions = await this.fallbackQuestionsRepo.find({
      where: { jobRole, category },
      order: { orderIndex: 'ASC' },
    });

    if (questions.length === 0) {
      // Fallback to any category for this role
      questions = await this.fallbackQuestionsRepo.find({
        where: { jobRole },
        order: { orderIndex: 'ASC' },
      });
    }

    if (questions.length === 0) {
      // Fallback to generic questions of this category
      questions = await this.fallbackQuestionsRepo.find({
        where: { category },
        order: { orderIndex: 'ASC' },
      });
    }

    let questionText: string;
    if (questions.length > 0) {
      questionText = questions[currentQuestionIndex % questions.length].question;
    } else {
      // 3. Absolute Fallbacks (if DB is empty or fails)
      const ABSOLUTE_FALLBACKS: Record<string, string[]> = {
        [FallbackQuestionCategory.EXPERIENCE]: [
          "To start off, could you walk me through your professional background and key highlights?",
          "What motivated you to apply for this specific role and join our team?",
          "Can you describe your ideal work environment and what helps you perform at your best?",
        ],
        [FallbackQuestionCategory.SKILL]: [
          "Can you explain a complex technical concept you've mastered recently?",
          "How do you approach learning a new language or framework on the job?",
          "What are the most important factors you consider when writing maintainable code?",
          "How do you handle technical debt in a fast-paced development environment?",
        ],
        [FallbackQuestionCategory.PROJECT]: [
          "Tell me about a project where you had to make a difficult architectural trade-off.",
          "Describe a time you had to debug a critical production issue under pressure.",
          "How do you handle disagreements with teammates regarding technical implementations?",
          "Can you talk about a time a project failed? What would you do differently now?",
        ]
      };

      const bank = ABSOLUTE_FALLBACKS[category] || ABSOLUTE_FALLBACKS[FallbackQuestionCategory.SKILL];
      questionText = bank[currentQuestionIndex % bank.length];
    }

    return questionText;
  }
}
