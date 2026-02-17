import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './candidate.entity';
import { Application, ApplicationStatus } from './application.entity';
import { OpenAIService } from '../ai/openai.service';
import { AuthService } from '../auth/auth.service';
import { Job } from '../jobs/job.entity';

@Injectable()
export class CandidatesService {
    constructor(
        @InjectRepository(Candidate)
        private candidatesRepository: Repository<Candidate>,
        @InjectRepository(Application)
        private applicationsRepository: Repository<Application>,
        @InjectRepository(Job)
        private jobsRepository: Repository<Job>,
        private openAIService: OpenAIService,
        private authService: AuthService,
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

        // 2. Parse Resume
        const parsedData = await this.openAIService.parseResume(resumeText);

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

    async parseResume(resumeText: string): Promise<any> {
        return this.openAIService.parseResume(resumeText);
    }

    // Application Methods
    async applyToJob(userId: string, jobId: string): Promise<Application> {
        let candidate = await this.findOneByUserId(userId);

        if (!candidate) {
            candidate = await this.candidatesRepository.save(
                this.candidatesRepository.create({
                    userId,
                    skills: [],
                    experienceYears: 0,
                    location: 'Remote',
                    resumeUrl: 'pending',
                    title: 'Candidate'
                })
            );
        }

        // Double check for linter satisfaction
        if (!candidate || !candidate.id) {
            throw new Error('Failed to identify or create candidate profile');
        }

        // Check if already applied
        const existing = await this.applicationsRepository.findOne({
            where: { candidateId: candidate.id, jobId }
        });

        if (existing) {
            return existing;
        }

        const application = this.applicationsRepository.create({
            candidateId: candidate.id,
            jobId,
            status: ApplicationStatus.APPLIED
        });

        return this.applicationsRepository.save(application);
    }

    async getMyApplications(userId: string): Promise<Application[]> {
        const candidate = await this.findOneByUserId(userId);
        if (!candidate) return [];
        return this.applicationsRepository.find({
            where: { candidateId: candidate.id },
            relations: ['job']
        });
    }

    async getStats(userId: string): Promise<any> {
        const candidate = await this.findOneByUserId(userId);
        if (!candidate) return { totalApplications: 0, interviewsCompleted: 0, avgScore: 0, profileStrength: 50 };

        const apps = await this.applicationsRepository.find({ where: { candidateId: candidate.id } });
        const interviewCount = apps.filter(a => a.status === ApplicationStatus.INTERVIEWING).length;

        const statusCounts = {
            underReview: apps.filter(a => a.status === ApplicationStatus.APPLIED || a.status === ApplicationStatus.SCREENING).length,
            shortlisted: apps.filter(a => a.status === ApplicationStatus.SHORTLISTED).length,
            interviewScheduled: interviewCount,
            rejected: apps.filter(a => a.status === ApplicationStatus.REJECTED).length,
            offerExtended: apps.filter(a => a.status === ApplicationStatus.OFFER_EXTENDED).length,
        };

        return {
            totalApplications: apps.length,
            interviewsCompleted: apps.filter(a => a.status === ApplicationStatus.INTERVIEWING || a.status === ApplicationStatus.OFFER_EXTENDED).length, // Simplified
            avgScore: apps.length > 0 ? Math.round(apps.reduce((acc, curr) => acc + curr.aiScore, 0) / apps.length) : 0,
            profileStrength: candidate.resumeText ? 90 : 50,
            statusCounts
        };
    }
}
