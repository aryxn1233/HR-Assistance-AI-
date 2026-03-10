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
  ) {}

  async getNextFallbackQuestion(
    jobRole: string,
    currentQuestionIndex: number,
  ): Promise<string> {
    this.logger.log(
      `Fetching fallback question for ${jobRole} at index ${currentQuestionIndex}`,
    );

    // Find questions matching the role, ordered by their index
    let questions = await this.fallbackQuestionsRepo.find({
      where: { jobRole },
      order: { orderIndex: 'ASC' },
    });

    if (questions.length === 0) {
      // Check if there are generic fallback questions
      questions = await this.fallbackQuestionsRepo.find({
        order: { orderIndex: 'ASC' }, // Just get anything as a last resort
      });
    }

    let finalQuestions = questions.map((q) => q.question);

    const ABSOLUTE_FALLBACKS = [
      'Can you explain a complex project you worked on recently?',
      'What is the most challenging technical problem you have solved?',
      'Describe JAVA and how it is different from other languages?',
      'What is the difference between JAVA and JAVASCRIPT?',
      'What are your favorite programming languages or tools, and why?',
      'Describe a situation where you had to meet a tight deadline.',
      'How do you approach debugging a particularly tricky issue?',
      'What architecture patterns are you most familiar with?',
      'How do you stay updated with the latest trends in software development?',
      'Can you talk about a time when a project failed and what you learned from it?',
    ];

    // If there are no questions or very few, pad with absolute fallbacks to ensure variety
    if (finalQuestions.length < 5) {
      finalQuestions = [...finalQuestions, ...ABSOLUTE_FALLBACKS];
    }

    // Return the question at the current index, or loop back around
    return finalQuestions[currentQuestionIndex % finalQuestions.length];
  }
}
