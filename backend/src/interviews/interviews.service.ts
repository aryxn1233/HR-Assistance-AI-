import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview, InterviewStatus } from './entities/interview.entity';
import { InterviewQuestion, QuestionDifficulty } from './entities/interview-question.entity';
import { InterviewAnswer } from './entities/interview-answer.entity';
import { InterviewReport, HiringRecommendation } from './entities/interview-report.entity';
import { GeminiService } from '../gemini/gemini.service';
import { OpenAIService } from '../ai/openai.service';
import { Application, ApplicationStatus } from '../candidates/application.entity';
import { Candidate } from '../candidates/candidate.entity';
import { DIdService } from '../did/did.service';
import { DIdSessionManager } from '../did/did-session.manager';
import { InterviewSessionService } from './question-generation/interview-session.service';
import { LiveInterviewService } from '../interview-agent/services/live-interview.service';
import { LiveInterviewGateway } from '../interview-agent/gateways/live-interview.gateway';

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
        private openAIService: OpenAIService,
        private didService: DIdService,
        private didSessionManager: DIdSessionManager,
        private interviewSessionService: InterviewSessionService,
        private liveInterviewService: LiveInterviewService,
        private liveInterviewGateway: LiveInterviewGateway,
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

        return interview;
    }

    async submitInterviewScore(applicationId: string, interviewScore: number, feedback?: any): Promise<Application> {
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
            feedback: feedback || application.feedback
        });

        // Also mark the associated interview as completed if found
        const interview = await this.interviewsRepository.findOne({ where: { applicationId } });
        if (interview) {
            // Update basic interview fields
            await this.interviewsRepository.update(interview.id, {
                status: 'completed',
                completed: true,
                score: interviewScore,
                feedback: feedback || interview.feedback,
                fitDecision: feedback?.fit_for_role || feedback?.fit,
                joinProbability: feedback?.joining_probability_percent || feedback?.score
            });

            // Create or update InterviewReport for the dashboard
            if (feedback) {
                const existingReport = await this.reportsRepository.findOne({ where: { interviewId: interview.id } });
                const reportData = {
                    interviewId: interview.id,
                    overallScore: (feedback.overall_rating || feedback.score / 10 || interviewScore / 10) * 10,
                    strengths: feedback.strengths || [],
                    weaknesses: feedback.weaknesses || feedback.areas_for_improvement || [],
                    recommendation: (feedback.fit_for_role === 'YES' || feedback.fit?.includes('Fit')) ? HiringRecommendation.HIRE : HiringRecommendation.NO_HIRE,
                    detailedAnalysis: feedback
                };

                if (existingReport) {
                    await this.reportsRepository.update(existingReport.id, reportData);
                } else {
                    const newReport = this.reportsRepository.create(reportData);
                    await this.reportsRepository.save(newReport);
                }
            }
        }

        return this.applicationsRepository.findOne({ where: { id: applicationId } }) as Promise<Application>;
    }

    async create(createInterviewDto: any): Promise<Interview> {
        const interview = this.interviewsRepository.create(createInterviewDto);
        return this.interviewsRepository.save(interview) as unknown as Promise<Interview>;
    }

    async findAll(user?: any): Promise<any[]> {
        const query = this.interviewsRepository.createQueryBuilder('interview')
            .leftJoinAndSelect('interview.candidate', 'candidate')
            .leftJoinAndSelect('candidate.user', 'user')
            .leftJoinAndSelect('interview.job', 'job')
            .leftJoinAndSelect('interview.report', 'report')
            .leftJoinAndSelect('interview.application', 'application')
            .orderBy('interview.createdAt', 'DESC');

        if (user) {
            // Only filter if candidate. Recruiter sees all.
            if (user.role === 'candidate') {
                query.where('user.id = :userId', { userId: user.userId });
            }
            // Add recruiter specific filtering here if multitenancy is needed later
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

    async startSession(id: string, streamId?: string, sessionId?: string): Promise<any> {
        try {
            const interview = await this.findOne(id);
            if (interview.status === InterviewStatus.COMPLETED) {
                return { status: 'completed', report: interview.report };
            }

            // Register D-ID Session for speech injection
            if (streamId && sessionId) {
                this.didSessionManager.setSession(id, { streamId, sessionId });
                console.log(`D-ID: Session ${sessionId} registered for interview ${id}`);
            }

            const user = interview.candidate?.user;
            const candidateName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Applicant' : 'Applicant';
            const jobRole = interview.job?.title || 'Unknown Role';

            this.liveInterviewService.addActiveInterview({
                interviewId: id,
                candidateName,
                jobRole,
                startedAt: new Date(),
                status: 'IN_PROGRESS'
            });

            this.liveInterviewGateway.broadcastInterviewStarted({
                interviewId: id,
                candidateName,
                jobRole,
                startedAt: new Date()
            });

            return await this.fetchAndSpeakNextQuestion(interview);
        } catch (err: any) {
            console.error(`startSession error for ${id}:`, err);
            throw err;
        }
    }

    private async fetchAndSpeakNextQuestion(interview: Interview): Promise<any> {
        const questionText = await this.interviewSessionService.getNextQuestion(interview.applicationId);

        if (!questionText) {
            return this.finishInterview(interview, "The interview is now complete. Thank you for your time!");
        }

        // Save Question to DB (for history/tracking)
        const question = this.questionsRepository.create({
            interviewId: interview.id,
            questionText: questionText,
            skillFocus: 'Technical',
            difficulty: QuestionDifficulty.MEDIUM,
            orderNumber: (interview.currentQuestionIndex || 0) + 1
        });
        await this.questionsRepository.save(question);

        // Update Interview state
        const newTranscript = [...(interview.transcript || []), { speaker: 'AI' as const, message: questionText, timestamp: new Date() }];
        const newHistory = [...(interview.history || []), { role: 'ai', content: questionText }];

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
                await this.didService.speak(didSession.sessionId, didSession.streamId, questionText);
            } catch (error) {
                console.error(`Failed to trigger D-ID speech:`, error.message);
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
        await this.interviewSessionService.submitAnswerAndAdvance(interview.applicationId);
        return await this.fetchAndSpeakNextQuestion(interview);
    }

    private async finishInterview(interview: Interview, closingMessage?: string): Promise<any> {
        interview.status = InterviewStatus.COMPLETED;
        this.liveInterviewService.removeActiveInterview(interview.id);

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

        // Check for minimum interactions (Candidate must have at least 3 answers for valid AI report)
        const candidateAnswersCount = (interview.transcript || []).filter(t => t.speaker === 'Candidate').length;

        let reportData: any;

        if (candidateAnswersCount < 3) {
            console.log(`Interview ${interview.id} has only ${candidateAnswersCount} answers. Bypassing AI evaluation.`);
            reportData = {
                overall_rating: 0,
                technical_score: 0,
                communication_score: 0,
                problem_solving_score: 0,
                behavioral_score: 0,
                culture_fit_score: 0,
                strengths: ['Interview completed'],
                weaknesses: ['Interview too short for meaningful analysis'],
                detailed_feedback: 'Score: 0\nFeedback: The interview was completed too quickly with insufficient interaction. Minimum 3 responses are required for AI evaluation.\nStrengths: \nAreas for Improvement: Complete the full interview next time.',
                fit_for_role: 'NO',
                joining_probability_percent: 0
            };
        } else {
            reportData = await this.openAIService.generateInterviewReport({
                job: interview.job?.title,
                messages: interview.transcript
            });
        }

        const report = this.reportsRepository.create({
            interviewId: interview.id,
            overallScore: reportData.overall_rating * 10,
            strengths: reportData.strengths || [],
            weaknesses: reportData.weaknesses || [],
            recommendation: reportData.fit_for_role === 'YES' ? HiringRecommendation.HIRE : HiringRecommendation.NO_HIRE,
            detailedAnalysis: reportData
        });
        await this.reportsRepository.save(report);

        // Clean up D-ID session if it exists
        const didSession = this.didSessionManager.getSession(interview.id);
        if (didSession) {
            try {
                await this.didService.closeSession(didSession.streamId, didSession.sessionId);
                this.didSessionManager.removeSession(interview.id);
                console.log(`D-ID: Session cleaned up for finished interview ${interview.id}`);
            } catch (e) {
                console.warn(`D-ID: Failed to clean up session for interview ${interview.id}`, e);
            }
        }

        const finalScore = reportData.overall_rating * 10;
        await this.interviewsRepository.update(interview.id, {
            status: InterviewStatus.COMPLETED,
            score: finalScore,
            fitDecision: reportData.fit_for_role,
            joinProbability: reportData.joining_probability_percent,
        });

        // Update Application Status
        await this.submitInterviewScore(interview.applicationId, finalScore, reportData);

        return { status: 'completed', report };
    }

    async finishSession(id: string): Promise<any> {
        const interview = await this.findOne(id);
        return this.finishInterview(interview, "The interview is now complete. Thank you!");
    }

    async speakCurrentQuestion(id: string): Promise<void> {
        const interview = await this.findOne(id);
        const transcript = interview.transcript || [];
        // Find the last AI message
        const lastAiMsg = [...transcript].reverse().find(t => t.speaker === 'AI');

        if (lastAiMsg) {
            const didSession = this.didSessionManager.getSession(id);
            if (didSession) {
                console.log(`D-ID: Re-triggering speech for interview ${id}: "${lastAiMsg.message.slice(0, 30)}..."`);
                await this.didService.speak(didSession.sessionId, didSession.streamId, lastAiMsg.message);
            } else {
                console.warn(`D-ID: No active session found to speak for interview ${id}`);
            }
        }
    }

}
