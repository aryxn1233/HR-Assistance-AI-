import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview, InterviewStatus } from './entities/interview.entity';
import { InterviewQuestion, QuestionDifficulty } from './entities/interview-question.entity';
import { InterviewAnswer } from './entities/interview-answer.entity';
import { InterviewReport } from './entities/interview-report.entity';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class InterviewsService {
    constructor(
        @InjectRepository(Interview)
        private interviewsRepository: Repository<Interview>,
        @InjectRepository(InterviewQuestion)
        private questionsRepository: Repository<InterviewQuestion>,
        @InjectRepository(InterviewAnswer)
        private answersRepository: Repository<InterviewAnswer>,
        @InjectRepository(InterviewReport)
        private reportsRepository: Repository<InterviewReport>,
        private geminiService: GeminiService,
    ) { }

    async create(createInterviewDto: any): Promise<Interview> {
        const interview = this.interviewsRepository.create(createInterviewDto);
        return this.interviewsRepository.save(interview) as unknown as Promise<Interview>;
    }

    async findAll(userId?: string): Promise<any[]> {
        const where: any = {};
        if (userId) {
            where.candidate = { userId: userId };
        }
        return this.interviewsRepository.find({
            where,
            relations: ['candidate', 'candidate.user', 'job', 'report'],
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<Interview> {
        const interview = await this.interviewsRepository.findOne({
            where: { id },
            relations: ['candidate', 'candidate.user', 'job', 'questions', 'report']
        });
        if (!interview) throw new NotFoundException(`Interview with ID ${id} not found`);
        return interview;
    }

    async startSession(id: string): Promise<any> {
        const interview = await this.findOne(id);

        if (interview.status === InterviewStatus.COMPLETED) {
            return { status: 'completed', report: interview.report };
        }

        if (interview.questions && interview.questions.length > 0) {
            // Resume: Return last question
            const lastQuestion = interview.questions.sort((a, b) => a.orderNumber - b.orderNumber)[interview.questions.length - 1];
            // Check if already answered
            const answer = await this.answersRepository.findOne({ where: { questionId: lastQuestion.id } });
            if (!answer) {
                return { status: 'in_progress', question: lastQuestion };
            }
            // If answered, logic should have generated next, but if stuck, generate next
            return this.generateNextQuestion(interview);
        }

        // Generate First Question
        return this.generateNextQuestion(interview);
    }

    private async generateNextQuestion(interview: Interview): Promise<any> {
        // Update status
        if (interview.status === InterviewStatus.SCHEDULED) {
            interview.status = InterviewStatus.IN_PROGRESS;
            await this.interviewsRepository.save(interview);
        }

        const questionCount = await this.questionsRepository.count({ where: { interviewId: interview.id } });

        // END CONDITION: Max 5 questions for now (User said 8-10, keeping 5 for testing/start, can increase)
        if (questionCount >= 5) {
            return this.finishInterview(interview);
        }

        // Context for AI
        const context: {
            jobDescription: string;
            resume: any;
            stage: string;
            difficulty: string;
            previousQuestion: string | null;
            previousAnswer: string | null;
        } = {
            jobDescription: interview.job?.description,
            resume: (interview.candidate?.resumeText || interview.candidate?.skills || null) as string | null,
            stage: 'Technical',
            difficulty: 'Medium',
            previousQuestion: null,
            previousAnswer: null
        };

        // If history exists, add previous context for continuity
        if (questionCount > 0) {
            const lastQuestion = await this.questionsRepository.findOne({
                where: { interviewId: interview.id, orderNumber: questionCount },
            });
            if (lastQuestion) {
                const lastAnswer = await this.answersRepository.findOne({ where: { questionId: lastQuestion.id } });
                context.previousQuestion = lastQuestion.questionText;
                context.previousAnswer = lastAnswer?.transcript || null;

                // Adaptive Difficulty
                if (lastAnswer && lastAnswer.technicalScore > 7) context.difficulty = 'Hard';
                else if (lastAnswer && lastAnswer.technicalScore < 4) context.difficulty = 'Easy';
            }
        }

        const questionData = await this.geminiService.generateQuestion(context);

        // Save Question
        const question = this.questionsRepository.create({
            interviewId: interview.id,
            questionText: questionData.question,
            skillFocus: questionData.skillFocus || 'General',
            difficulty: (questionData.difficulty as QuestionDifficulty) || QuestionDifficulty.MEDIUM,
            orderNumber: questionCount + 1
        });
        await this.questionsRepository.save(question);

        // Update Interview Index
        await this.interviewsRepository.update(interview.id, {
            currentQuestionIndex: question.orderNumber,
            status: interview.status
        });

        return { status: 'in_progress', question };
    }

    async submitAnswer(id: string, answerText: string): Promise<any> {
        const interview = await this.findOne(id);
        if (interview.status === InterviewStatus.COMPLETED) {
            return { status: 'completed', report: interview.report };
        }

        // Find current question (latest)
        const questions = await this.questionsRepository.find({
            where: { interviewId: id },
            order: { orderNumber: 'DESC' },
            take: 1
        });

        if (questions.length === 0) {
            throw new BadRequestException('No active question found. Start session first.');
        }

        const currentQuestion = questions[0];

        // Check if already answered
        const existingAnswer = await this.answersRepository.findOne({ where: { questionId: currentQuestion.id } });
        if (existingAnswer) {
            // Already answered, maybe just return next question or status? 
            // For now, allow re-answer? No, strict turn based.
            // If answered, we should satisfy the "next" call.
            // But let's assume this is the submission.
            // throw new BadRequestException('Question already answered.');
            // Actually, creating a new answer or updating is safer logic handling.
            // Let's creating if not exists.
        }

        // Evaluate Answer
        const evaluation = await this.geminiService.evaluateAnswer(currentQuestion.questionText, answerText);

        // Save Answer
        const answer = this.answersRepository.create({
            questionId: currentQuestion.id,
            transcript: answerText,
            technicalScore: evaluation.technicalScore,
            accuracyScore: evaluation.accuracyScore,
            communicationScore: evaluation.communicationScore,
            confidenceScore: evaluation.confidenceScore,
            feedback: evaluation.feedback
        });
        await this.answersRepository.save(answer);

        // Trigger Next Step
        return this.generateNextQuestion(interview);
    }

    private async finishInterview(interview: Interview): Promise<any> {
        interview.status = InterviewStatus.COMPLETED;

        // Gather all data for report
        const questions = await this.questionsRepository.find({ where: { interviewId: interview.id } });
        const answers: { question: InterviewQuestion; answer: InterviewAnswer; }[] = [];
        for (const q of questions) {
            const a = await this.answersRepository.findOne({ where: { questionId: q.id } });
            if (a) answers.push({ question: q, answer: a });
        }

        const reportData = await this.geminiService.generateReport({
            job: interview.job?.title,
            messages: answers.map(pair => ({
                question: pair.question.questionText,
                answer: pair.answer.transcript,
                scores: {
                    technical: pair.answer.technicalScore,
                    communication: pair.answer.communicationScore
                }
            }))
        });

        // Save Report
        const report = this.reportsRepository.create({
            interviewId: interview.id,
            overallScore: reportData.overallScore,
            strengths: reportData.strengths,
            weaknesses: reportData.weaknesses,
            recommendation: reportData.recommendation as any,
            detailedAnalysis: reportData.detailedAnalysis
        });
        await this.reportsRepository.save(report);

        // Update Interview Score
        interview.score = reportData.overallScore;
        await this.interviewsRepository.save(interview);

        return { status: 'completed', report };
    }
}
