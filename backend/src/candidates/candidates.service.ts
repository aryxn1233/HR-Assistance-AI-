import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Candidate } from './candidate.entity';
import { Application, ApplicationStatus } from './application.entity';
import { OpenAIService } from '../ai/openai.service';
import { AuthService } from '../auth/auth.service';
import { Job } from '../jobs/job.entity';
import { ScoringService } from '../scoring/scoring.service';
const pdf = require('pdf-parse');

import { Interview } from '../interviews/entities/interview.entity';
import { CandidateExperience } from './experience.entity';
import { ResumeParserService } from '../interviews/question-generation/resume-parser.service';
import { SkillMatchingService } from '../interviews/question-generation/skill-matching.service';
import { QuestionGenerationService } from '../interviews/question-generation/question-generation.service';

@Injectable()
export class CandidatesService {
    constructor(
        @InjectRepository(Candidate)
        private candidatesRepository: Repository<Candidate>,
        @InjectRepository(Application)
        private applicationsRepository: Repository<Application>,
        @InjectRepository(Job)
        private jobsRepository: Repository<Job>,
        @InjectRepository(Interview)
        private interviewsRepository: Repository<Interview>,
        @InjectRepository(CandidateExperience)
        private experienceRepository: Repository<CandidateExperience>,
        private openAIService: OpenAIService,
        private authService: AuthService,
        private scoringService: ScoringService,
        private resumeParserService: ResumeParserService,
        private skillMatchingService: SkillMatchingService,
        private questionGenerationService: QuestionGenerationService,
        private dataSource: DataSource,
    ) { }

    async create(createCandidateDto: any, userId: string): Promise<Candidate> {
        const candidate = this.candidatesRepository.create({ ...createCandidateDto, userId });
        return this.candidatesRepository.save(candidate) as unknown as Promise<Candidate>;
    }

    async createCandidateWithUser(firstName: string, lastName: string, email: string, resumeText: string): Promise<Candidate> {
        // 1. Create User
        const password = "tempPassword123!";
        let user;

        try {
            user = await this.authService.register({
                email,
                password,
                firstName,
                lastName,
                role: 'candidate',
            });
        } catch (error) {
            throw new Error(`User with email ${email} already exists or failed to create.`);
        }

        // 2. Parse Resume (Local)
        const parsedData = this.basicParseResume(resumeText);

        // 3. Create Candidate Profile
        const candidateData = {
            userId: user.id,
            skills: parsedData.skills || [],
            experienceYears: parsedData.experienceYears || 0,
            resumeUrl: 'pending_upload',
            location: 'Remote',
        };

        return this.create(candidateData, user.id);
    }

    async findAll(): Promise<Candidate[]> {
        return this.candidatesRepository.find({ relations: ['user'] });
    }

    async findOneByUserId(userId: string): Promise<Candidate | null> {
        return this.candidatesRepository.findOne({ where: { userId }, relations: ['user'] });
    }

    async findOne(id: string): Promise<Candidate | null> {
        return this.candidatesRepository.findOne({ where: { id }, relations: ['user'] });
    }

    async update(userId: string, updateCandidateDto: any): Promise<Candidate> {
        const { firstName, lastName, avatarUrl, ...candidateData } = updateCandidateDto;

        if (firstName || lastName || avatarUrl) {
            await this.authService.updateUser(userId, { firstName, lastName, avatarUrl });
        }

        const candidate = await this.findOneByUserId(userId);
        if (candidate) {
            const updatePayload = avatarUrl ? { ...candidateData, avatarUrl } : candidateData;
            await this.candidatesRepository.update(candidate.id, updatePayload);
            const updated = await this.findOneByUserId(userId);
            if (!updated) throw new Error('Candidate not found after update');
            return updated;
        }

        return this.create(candidateData, userId);
    }

    basicParseResume(resumeText: string): any {
        const text = resumeText.toLowerCase();
        const commonSkills = ['javascript', 'typescript', 'react', 'nodejs', 'nest', 'python', 'java', 'sql', 'docker', 'aws', 'azure', 'ai', 'blockchain', 'php', 'sap', 'security'];
        const extractedSkills = commonSkills.filter(skill => text.includes(skill));

        // Very basic experience extraction (looking for "X years")
        const expMatch = text.match(/(\d+)\s*(?:years|yr|years of experience)/i);
        const experienceYears = expMatch ? parseInt(expMatch[1]) : 0;

        return {
            skills: extractedSkills,
            experienceYears
        };
    }

    async parseResume(resumeText: string): Promise<any> {
        return this.basicParseResume(resumeText);
    }

    async uploadResume(userId: string, filePath: string, fileUrl: string): Promise<Candidate> {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const resumeText = data.text;

        const parsedData = this.basicParseResume(resumeText);

        const candidate = await this.findOneByUserId(userId);
        if (candidate) {
            await this.candidatesRepository.update(candidate.id, {
                resumeText,
                resumeUrl: fileUrl,
                skills: parsedData.skills || candidate.skills,
                experienceYears: parsedData.experienceYears || candidate.experienceYears,
            });
            const updated = await this.findOneByUserId(userId);
            if (!updated) throw new Error('Candidate not found after update');
            return updated;
        }

        const candidateData = {
            userId,
            resumeText,
            resumeUrl: fileUrl,
            skills: parsedData.skills || [],
            experienceYears: parsedData.experienceYears || 0,
            location: 'Remote',
        };

        return this.create(candidateData, userId);
    }

    // Application Methods
    async applyToJob(userId: string, jobId: string): Promise<Application> {
        const candidate = await this.findOneByUserId(userId);

        if (!candidate) throw new NotFoundException('Candidate profile not found.');
        if (!candidate.resumeText) throw new BadRequestException('Resume upload is mandatory before applying.');

        // Check if already applied
        const existing = await this.applicationsRepository.findOne({
            where: { candidateId: candidate.id, jobId }
        });

        if (existing) throw new BadRequestException('Already applied to this job.');

        const job = await this.jobsRepository.findOne({ where: { id: jobId } });
        if (!job) throw new NotFoundException('Job not found.');

        // AI Scoring
        const scoringResult = await this.scoringService.evaluateResume(candidate.resumeText, job.description);

        const isEligible = scoringResult.resumeScore >= 40;
        let interviewQuestions: string[] = [];
        let parsedResume: any = null;

        if (isEligible) {
            try {
                // 1. Parse Resume
                parsedResume = await this.resumeParserService.parse(candidate.resumeText);

                // 2. Skill Matching
                const skillMatch = this.skillMatchingService.match(job.requiredSkills || [], parsedResume.skills || []);

                // 3. Generate Questions
                interviewQuestions = await this.questionGenerationService.generate20Questions(
                    parsedResume,
                    skillMatch,
                    job.title
                );
            } catch (err) {
                console.error('Failed to pre-generate questions:', err);
                // Fallback: empty array, will handle during session if needed
            }
        }

        const application = this.applicationsRepository.create({
            candidateId: candidate.id,
            jobId,
            resumeScore: scoringResult.resumeScore,
            resumeBreakdown: scoringResult.resumeBreakdown,
            category: scoringResult.category,
            shortlisted: isEligible,
            interviewUnlocked: isEligible,
            status: isEligible ? ApplicationStatus.INTERVIEW_ELIGIBLE : ApplicationStatus.REJECTED_AI,
            interviewQuestions,
            parsedResume,
            interviewStatus: isEligible ? 'ready' : 'not_started'
        });

        const savedApp = await this.applicationsRepository.save(application);

        // Update Ranks for this job
        await this.updateRanks(jobId);

        return this.applicationsRepository.findOne({ where: { id: savedApp.id } }) as Promise<Application>;
    }

    async updateRanks(jobId: string): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            const applications = await manager.find(Application, {
                where: { jobId },
                order: { resumeScore: 'DESC' },
            });

            for (let i = 0; i < applications.length; i++) {
                await manager.update(Application, applications[i].id, { rank: i + 1 });
            }
        });
    }

    async getMyApplications(userId: string): Promise<any[]> {
        const candidate = await this.findOneByUserId(userId);
        if (!candidate) return [];

        const apps = await this.applicationsRepository.find({
            where: { candidateId: candidate.id },
            relations: ['job']
        });

        return apps.map(app => {
            const isTopTalent = app.rank !== null && app.rank <= 3;
            const canSeeDetails = app.resumeScore >= 40;

            const baseApp = {
                id: app.id,
                jobId: app.jobId,
                job: app.job,
                createdAt: app.createdAt,
                status: app.status,
                rank: app.rank,
                isTopTalent,
            };

            if (canSeeDetails) {
                return {
                    ...baseApp,
                    resumeScore: app.resumeScore,
                    resumeBreakdown: app.resumeBreakdown,
                    category: app.category,
                };
            } else {
                return {
                    ...baseApp,
                    message: "Application under review",
                };
            }
        });
    }

    async getStats(userId: string): Promise<any> {
        const candidate = await this.findOneByUserId(userId);
        if (!candidate) return { totalApplications: 0, interviewsCompleted: 0, avgScore: 0, profileStrength: 0 };

        const apps = await this.applicationsRepository.find({ where: { candidateId: candidate.id } });

        const statusCounts = {
            underReview: apps.filter(a => a.status === ApplicationStatus.APPLIED).length,
            eligible: apps.filter(a => a.status === ApplicationStatus.INTERVIEW_ELIGIBLE).length,
            interviews: apps.filter(a => a.status === ApplicationStatus.INTERVIEWED || a.status === ApplicationStatus.INTERVIEW_ELIGIBLE).length,
            rejected: apps.filter(a => a.status === ApplicationStatus.REJECTED || a.status === ApplicationStatus.REJECTED_AI || a.status === ApplicationStatus.REJECTED_POST_INTERVIEW).length,
            selected: apps.filter(a => a.status === ApplicationStatus.SELECTED).length,
        };

        // Calculate Profile Strength
        let strength = 0;
        const isSet = (val: any) => val && val.toString().trim().length > 0;

        if (isSet(candidate.resumeText)) strength += 30;
        if (isSet(candidate.avatarUrl)) strength += 10;
        if (isSet(candidate.bio)) strength += 10;
        if (isSet(candidate.location)) strength += 10;
        if (isSet(candidate.linkedinUrl)) strength += 10;
        if (isSet(candidate.portfolioUrl)) strength += 10;
        if (candidate.skills && candidate.skills.length > 0) strength += 10;
        if (candidate.experienceYears > 0) strength += 10;

        return {
            totalApplications: apps.length,
            interviewsCompleted: apps.filter(a => [
                ApplicationStatus.INTERVIEWED,
                ApplicationStatus.SELECTED,
                ApplicationStatus.HOLD,
                ApplicationStatus.REJECTED_POST_INTERVIEW
            ].includes(a.status as ApplicationStatus)).length,
            avgScore: apps.length > 0 ? Math.round(apps.reduce((acc, curr) => acc + (curr.resumeScore || 0), 0) / apps.length) : 0,
            profileStrength: Math.min(strength, 100),
            statusCounts
        };
    }

    // New Detailed Methods for Recruiter
    async findOneWithDetails(id: string): Promise<any> {
        const candidate = await this.candidatesRepository.findOne({
            where: { id },
            relations: ['user', 'experiences']
        });

        if (!candidate) throw new NotFoundException('Candidate not found');

        const applications = await this.applicationsRepository.find({
            where: { candidateId: candidate.id },
            relations: ['job'],
            order: { createdAt: 'DESC' }
        });

        const interviews = await this.interviewsRepository.find({
            where: { candidateId: candidate.id },
            relations: ['job', 'report'],
            order: { createdAt: 'DESC' }
        });

        return {
            ...candidate,
            applications,
            interviews
        };
    }

    async addExperience(userId: string, experienceDto: any): Promise<CandidateExperience> {
        const candidate = await this.findOneByUserId(userId);
        if (!candidate) throw new NotFoundException('Candidate not found');

        // Basic normalization
        const experience = new CandidateExperience();
        experience.employer = experienceDto.employer;
        experience.role = experienceDto.role;

        // Handle dates: convert empty strings to null
        experience.startDate = (experienceDto.startDate && experienceDto.startDate.trim() !== "")
            ? new Date(experienceDto.startDate)
            : null;

        experience.endDate = (experienceDto.endDate && experienceDto.endDate.trim() !== "")
            ? new Date(experienceDto.endDate)
            : null;

        experience.description = (experienceDto.description && experienceDto.description.trim() !== "")
            ? experienceDto.description
            : null;

        experience.isCurrent = experienceDto.isCurrent || false;
        experience.candidateId = candidate.id;

        // Validation
        if (!experience.employer || !experience.role || !experience.startDate) {
            throw new BadRequestException('Employer, role, and valid start date are required');
        }

        return this.experienceRepository.save(experience);
    }

    async updateExperience(id: string, experienceDto: any): Promise<CandidateExperience> {
        // Normalize fields for update too
        const updatePayload: any = { ...experienceDto };

        if (updatePayload.startDate === "") updatePayload.startDate = null;
        if (updatePayload.endDate === "") updatePayload.endDate = null;
        if (updatePayload.description === "") updatePayload.description = null;

        await this.experienceRepository.update(id, updatePayload);
        const updated = await this.experienceRepository.findOne({ where: { id } });
        if (!updated) throw new NotFoundException('Experience not found');
        return updated;
    }

    async removeExperience(id: string): Promise<void> {
        await this.experienceRepository.delete(id);
    }

    async getExperiences(userId: string): Promise<CandidateExperience[]> {
        const candidate = await this.findOneByUserId(userId);
        if (!candidate) return [];
        return this.experienceRepository.find({
            where: { candidateId: candidate.id },
            order: { startDate: 'DESC' }
        });
    }

    async updateApplicationStatus(applicationId: string, status: string): Promise<Application> {
        const application = await this.applicationsRepository.findOne({ where: { id: applicationId } });
        if (!application) throw new NotFoundException('Application not found');

        // Validate status
        if (!Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
            throw new BadRequestException('Invalid application status');
        }

        application.status = status;
        return this.applicationsRepository.save(application);
    }
}
