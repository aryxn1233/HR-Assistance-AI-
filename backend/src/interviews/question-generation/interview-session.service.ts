import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../../candidates/application.entity';

@Injectable()
export class InterviewSessionService {
    constructor(
        @InjectRepository(Application)
        private applicationsRepository: Repository<Application>
    ) { }

    async getNextQuestion(applicationId: string): Promise<string | null> {
        const application = await this.applicationsRepository.findOne({ where: { id: applicationId } });
        if (!application) throw new NotFoundException('Application not found');

        if (!application.interviewQuestions || application.interviewQuestions.length === 0) {
            return null;
        }

        const index = application.currentQuestionIndex || 0;
        if (index >= application.interviewQuestions.length) {
            return null; // Interview complete
        }

        return application.interviewQuestions[index];
    }

    async submitAnswerAndAdvance(applicationId: string): Promise<boolean> {
        const application = await this.applicationsRepository.findOne({ where: { id: applicationId } });
        if (!application) throw new NotFoundException('Application not found');

        const nextIndex = (application.currentQuestionIndex || 0) + 1;
        const total = (application.interviewQuestions || []).length;

        await this.applicationsRepository.update(applicationId, {
            currentQuestionIndex: nextIndex,
            interviewStatus: nextIndex >= total ? 'completed' : 'in_progress'
        });

        return nextIndex >= total;
    }
}
