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
  ) {}

  async getNextFallbackQuestion(
    jobRole: string,
    currentQuestionIndex: number,
  ): Promise<string> {
    this.logger.log(
      `Fetching fallback question for ${jobRole} at index ${currentQuestionIndex}`,
    );

    // Find questions matching the role, ordered by their index
    // We'll fallback to a generic set if no exact role matches
    let questions = await this.fallbackQuestionsRepo.find({
      where: { jobRole },
      order: { orderIndex: 'ASC' },
    });

    if (questions.length === 0) {
      // Check if there are generic 'Software Engineer' or 'General' fallback questions
      questions = await this.fallbackQuestionsRepo.find({
        order: { orderIndex: 'ASC' }, // Just get anything as a last resort
      });

      if (questions.length === 0) {
        return 'Can you explain a complex project you worked on recently?'; // absolute fallback
      }
    }

    // Return the question at the current index, or loop back around
    const fallback = questions[currentQuestionIndex % questions.length];
    return fallback.question;
  }
}
