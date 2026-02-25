import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview, InterviewStatus } from './entities/interview.entity';
import { InterviewQuestion, QuestionDifficulty } from './entities/interview-question.entity';
import { InterviewAnswer } from './entities/interview-answer.entity';
import { InterviewReport, HiringRecommendation } from './entities/interview-report.entity';
import { GeminiService } from '../gemini/gemini.service';
import { Application, ApplicationStatus } from '../candidates/application.entity';
import { Candidate } from '../candidates/candidate.entity';
import { DIdService } from '../did/did.service';
import { DIdSessionManager } from '../did/did-session.manager';

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
        @InjectRepository(Application)
        private applicationsRepository: Repository<Application>,
        @InjectRepository(Candidate)
        private candidatesRepository: Repository<Candidate>,
        private geminiService: GeminiService,
        private didService: DIdService,
        private didSessionManager: DIdSessionManager,
    ) { }

    async startInterviewByApplication(applicationId: string, userId: string): Promise<any> {
        const application = await this.applicationsRepository.findOne({
            where: { id: applicationId },
            relations: ['candidate', 'job']
        });

        if (!application) throw new NotFoundException('Application not found');
        if (application.candidate.userId !== userId) {
            throw new ForbiddenException('You are not authorized to start this interview');
        }

        // Block explicitly rejected applications
        const blockedStatuses = [
            ApplicationStatus.REJECTED,
            ApplicationStatus.REJECTED_AI,
            ApplicationStatus.REJECTED_POST_INTERVIEW
        ];
        if (blockedStatuses.includes(application.status as ApplicationStatus)) {
            throw new ForbiddenException('This application has been rejected and cannot proceed to interview.');
        }

        // Check if interview already exists
        let interview = await this.interviewsRepository.findOne({
            where: { applicationId }
        });

        if (!interview) {
            // Mark application as interview_eligible if not already
            if (application.status !== ApplicationStatus.INTERVIEW_ELIGIBLE) {
                await this.applicationsRepository.update(applicationId, {
                    status: ApplicationStatus.INTERVIEW_ELIGIBLE
                });
            }

            interview = this.interviewsRepository.create({
                applicationId,
                jobId: application.jobId,
                candidateId: application.candidateId,
                status: InterviewStatus.CREATED,
                score: 0,
                currentQuestionIndex: 0,
                history: []
            });
            await this.interviewsRepository.save(interview);
        }

        return this.startSession(interview.id);
    }

    async submitInterviewScore(applicationId: string, interviewScore: number): Promise<Application> {
        const application = await this.applicationsRepository.findOne({ where: { id: applicationId } });
        if (!application) throw new NotFoundException('Application not found');

        const resumeScore = application.resumeScore || 0;
        const finalHiringScore = Math.round((resumeScore * 0.6) + (interviewScore * 0.4));

        let status = ApplicationStatus.REJECTED_POST_INTERVIEW;
        if (finalHiringScore >= 60) {
            status = ApplicationStatus.SELECTED;
        } else if (finalHiringScore >= 50) {
            status = ApplicationStatus.HOLD;
        }

        await this.applicationsRepository.update(applicationId, {
            interviewScore,
            finalHiringScore,
            status,
        });

        return this.applicationsRepository.findOne({ where: { id: applicationId } }) as Promise<Application>;
    }

    async create(createInterviewDto: any): Promise<Interview> {
        const interview = this.interviewsRepository.create(createInterviewDto);
        return this.interviewsRepository.save(interview) as unknown as Promise<Interview>;
    }

    async findAll(userId?: string): Promise<any[]> {
        const query = this.interviewsRepository.createQueryBuilder('interview')
            .leftJoinAndSelect('interview.candidate', 'candidate')
            .leftJoinAndSelect('candidate.user', 'user')
            .leftJoinAndSelect('interview.job', 'job')
            .leftJoinAndSelect('interview.report', 'report')
            .orderBy('interview.createdAt', 'DESC');

        if (userId) {
            query.where('user.id = :userId', { userId });
        }

        return query.getMany();
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
        try {
            const interview = await this.findOne(id);
            console.log(`startSession: interview ${id} status=${interview.status} questions=${interview.questions?.length}`);

            if (interview.status === InterviewStatus.COMPLETED) {
                return { status: 'completed', report: interview.report };
            }

            // Return current state or generate opening if newly created
            if (interview.status === InterviewStatus.CREATED) {
                return await this.generateNextQuestion(interview);
            }

            const questionCount = interview.questions?.length || 0;
            if (questionCount > 0) {
                const lastQuestion = interview.questions.sort((a, b) => a.orderNumber - b.orderNumber)[questionCount - 1];
                const answer = await this.answersRepository.findOne({ where: { questionId: lastQuestion.id } });
                if (!answer) {
                    return { status: 'in_progress', question: lastQuestion };
                }
                return await this.generateNextQuestion(interview);
            }

            return await this.generateNextQuestion(interview);
        } catch (err: any) {
            const msg = `startSession error for ${id}: ${err?.stack || err?.message || err}\n`;
            console.error(msg);
            require('fs').writeFileSync('interview-error.log', msg);
            throw err;
        }
    }

    private async generateNextQuestion(interview: Interview): Promise<any> {
        // Update status if it's newly created
        if (interview.status === InterviewStatus.CREATED) {
            interview.status = InterviewStatus.IN_PROGRESS;
            // No save here yet, will save with question
        }

        const questionCount = await this.questionsRepository.count({ where: { interviewId: interview.id } });

        // Context for AI - simplified using history
        const context = {
            jobDescription: interview.job?.description,
            resume: (interview.candidate?.resumeText || interview.candidate?.skills || null),
            history: interview.history || [],
            difficulty: 'Medium',
        };

        const questionData = await this.geminiService.generateQuestion(context);

        if ((questionData as any).isComplete) {
            const closingMsg = questionData.question === 'INTERVIEW_COMPLETE'
                ? 'The interview is now complete. Thank you for your time!'
                : questionData.question;
            return this.finishInterview(interview, closingMsg);
        }

        // Save Question
        const question = this.questionsRepository.create({
            interviewId: interview.id,
            questionText: questionData.question,
            skillFocus: questionData.skillFocus || 'General',
            difficulty: (questionData.difficulty as QuestionDifficulty) || QuestionDifficulty.MEDIUM,
            orderNumber: questionCount + 1
        });
        await this.questionsRepository.save(question);

        // Update only the specific fields on Interview — do NOT use save(interview) as it
        // will try to cascade-update loaded relations (candidate, job, etc.) and fail.
        const newTranscript = [...(interview.transcript || []), { speaker: 'AI' as const, message: questionData.question, timestamp: new Date() }];
        const newHistory = [...(interview.history || []), { role: 'ai', content: questionData.question }];
        await this.interviewsRepository.update(interview.id, {
            transcript: newTranscript,
            history: newHistory,
            currentQuestionIndex: question.orderNumber,
            status: InterviewStatus.IN_PROGRESS,
        });

        // D-ID Speech Injection
        const didSession = this.didSessionManager.getSession(interview.id);
        if (didSession) {
            try {
                await this.didService.speak(didSession.sessionId, didSession.streamId, questionData.question);
            } catch (error) {
                console.error(`Failed to trigger D-ID speech for interview ${interview.id}:`, error.message);
            }
        }

        return { status: 'in_progress', question };
    }

    async submitAnswer(id: string, answerText: string): Promise<any> {
        const interview = await this.findOne(id);
        if (interview.status === InterviewStatus.COMPLETED) {
            return { status: 'completed', report: interview.report };
        }

        // Find current question
        const questions = await this.questionsRepository.find({
            where: { interviewId: id },
            order: { orderNumber: 'DESC' },
            take: 1
        });

        if (questions.length === 0) {
            throw new BadRequestException('No active question found.');
        }

        const currentQuestion = questions[0];

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

        // Update Interview Transcript — use update() not save() to avoid TypeORM cascade issues
        const updatedTranscript = [...(interview.transcript || []), { speaker: 'Candidate' as const, message: answerText, timestamp: new Date() }];
        const updatedHistory = [...(interview.history || []), { role: 'user', content: answerText }];
        await this.interviewsRepository.update(id, {
            transcript: updatedTranscript,
            history: updatedHistory,
        });
        // Sync the object too so generateNextQuestion uses the updated values
        interview.transcript = updatedTranscript;
        interview.history = updatedHistory;

        // Trigger Next Step
        return await this.generateNextQuestion(interview);
    }

    private async finishInterview(interview: Interview, closingMessage?: string): Promise<any> {
        interview.status = InterviewStatus.COMPLETED;

        if (closingMessage) {
            const finalTranscript = [...(interview.transcript || []), { speaker: 'AI' as const, message: closingMessage, timestamp: new Date() }];
            const finalHistory = [...(interview.history || []), { role: 'ai', content: closingMessage }];
            await this.interviewsRepository.update(interview.id, {
                transcript: finalTranscript,
                history: finalHistory
            });
            interview.transcript = finalTranscript;
            interview.history = finalHistory;

            // D-ID Speech Injection for closing message
            const didSession = this.didSessionManager.getSession(interview.id);
            if (didSession) {
                try {
                    await this.didService.speak(didSession.sessionId, didSession.streamId, closingMessage);
                } catch (error) {
                    console.error(`Failed to trigger D-ID speech for interview ${interview.id} completion:`, error.message);
                }
            }
        }

        // Gather all data for report
        const questions = await this.questionsRepository.find({ where: { interviewId: interview.id } });
        const answers: { question: InterviewQuestion; answer: InterviewAnswer; }[] = [];
        for (const q of questions) {
            const a = await this.answersRepository.findOne({ where: { questionId: q.id } });
            if (a) answers.push({ question: q, answer: a });
        }

        const reportData = await this.geminiService.generateReport({
            job: interview.job?.title,
            messages: interview.transcript
        });

        // Save Report
        const report = this.reportsRepository.create({
            interviewId: interview.id,
            overallScore: reportData.overall_rating * 10,
            strengths: reportData.strengths,
            weaknesses: reportData.weaknesses,
            recommendation: reportData.fit_for_role === 'YES' ? HiringRecommendation.HIRE : HiringRecommendation.NO_HIRE,
            detailedAnalysis: reportData
        });
        await this.reportsRepository.save(report);

        // Update Interview fields — use update() not save() to avoid TypeORM cascade issues
        const finalScore = reportData.overall_rating * 10;
        await this.interviewsRepository.update(interview.id, {
            status: InterviewStatus.COMPLETED,
            score: finalScore,
            fitDecision: reportData.fit_for_role,
            joinProbability: reportData.joining_probability_percent,
        });

        // Update Application Status
        await this.submitInterviewScore(interview.applicationId, finalScore);

        return { status: 'completed', report };
    }

}
