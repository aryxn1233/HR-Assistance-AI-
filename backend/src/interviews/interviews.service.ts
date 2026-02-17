import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview, InterviewStatus } from './interview.entity';
import { OpenAIService } from '../ai/openai.service';

@Injectable()
export class InterviewsService {
    constructor(
        @InjectRepository(Interview)
        private interviewsRepository: Repository<Interview>,
        private openAIService: OpenAIService,
    ) { }

    async create(createInterviewDto: any): Promise<Interview> {
        const interview = this.interviewsRepository.create(createInterviewDto);
        return this.interviewsRepository.save(interview) as unknown as Promise<Interview>;
    }

    async findAll(): Promise<Interview[]> {
        return this.interviewsRepository.find({ relations: ['candidate', 'candidate.user', 'job'] });
    }

    async findOne(id: string): Promise<Interview | null> {
        return this.interviewsRepository.findOne({ where: { id }, relations: ['candidate', 'candidate.user', 'job'] });
    }

    async updateStatus(id: string, status: InterviewStatus): Promise<Interview> {
        await this.interviewsRepository.update(id, { status });
        const interview = await this.findOne(id);
        if (!interview) {
            throw new NotFoundException(`Interview with ID ${id} not found`);
        }
        return interview;
    }

    async saveTranscript(id: string, transcript: string): Promise<Interview> {
        await this.interviewsRepository.update(id, { transcript });
        const interview = await this.findOne(id);
        if (!interview) {
            throw new NotFoundException(`Interview with ID ${id} not found`);
        }
        return interview;
    }

    // New methods for Interview Room

    async generateNextQuestion(interviewId: string): Promise<string> {
        const interview = await this.findOne(interviewId);
        if (!interview) throw new NotFoundException('Interview not found');

        const jobDescription = interview.job?.description || "Software Engineer role";
        const history = interview.history || [];

        // Generate question using AI
        const question = await this.openAIService.generateInterviewQuestion(jobDescription, JSON.stringify(history));

        // Save question to history
        if (!interview.history) interview.history = [];
        interview.history.push({ role: 'ai', content: question });
        await this.interviewsRepository.save(interview);

        return question;
    }

    async processAnswer(interviewId: string, answer: string): Promise<string | null> {
        const interview = await this.findOne(interviewId);
        if (!interview) throw new NotFoundException('Interview not found');

        // Save User Answer
        if (!interview.history) interview.history = [];
        interview.history.push({ role: 'user', content: answer });

        // Check if interview should end (e.g. 5 questions)
        const questionCount = interview.history.filter(m => m.role === 'ai').length;
        if (questionCount >= 5) {
            // End interview
            interview.status = InterviewStatus.COMPLETED;
            // Calculate final score
            const evaluation = await this.openAIService.evaluateAnswer("Overall Interview", JSON.stringify(interview.history));
            interview.score = (typeof evaluation.score === 'number' ? evaluation.score : 85) * 10; // Normalized to 0-100 if score is 0-10
            interview.feedback = evaluation;
            await this.interviewsRepository.save(interview);
            return null; // Signals end
        }

        await this.interviewsRepository.save(interview);

        // Generate next question
        return this.generateNextQuestion(interviewId);
    }
}
