import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { Application } from '../candidates/application.entity';
import { UserRole } from '../auth/user.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
  ) {}

  async create(createJobDto: any, recruiterId: string): Promise<Job> {
    const job = this.jobsRepository.create({
      ...createJobDto,
      createdBy: recruiterId,
    });
    return this.jobsRepository.save(job) as unknown as Promise<Job>;
  }

  async findAll(): Promise<any[]> {
    const jobs = await this.jobsRepository.find();
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const count = await this.applicationsRepository.count({
          where: { jobId: job.id },
        });
        return {
          ...job,
          applicantCount: count,
        };
      }),
    );
    return jobsWithCounts;
  }

  async findOne(id: string): Promise<Job> {
    const job = await this.jobsRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async update(id: string, updateJobDto: any): Promise<Job> {
    await this.jobsRepository.update(id, updateJobDto);
    return this.findOne(id);
  }

  async remove(id: string, recruiterId: string, role?: string): Promise<void> {
    console.log(
      `Attempting to delete job: ${id} by recruiter: ${recruiterId} (Role: ${role})`,
    );
    const job = await this.findOne(id);
    console.log(`Job found: ${job.title}, createdBy: ${job.createdBy}`);

    // Allow deletion if:
    // 1. User is the creator
    // 2. Job has no creator and user is a recruiter
    const isOwner = job.createdBy === recruiterId;
    const isOrphanedRecruiter = !job.createdBy && role === UserRole.RECRUITER;

    if (!isOwner && !isOrphanedRecruiter) {
      console.log(
        `Permission denied: isOwner=${isOwner}, isOrphanedRecruiter=${isOrphanedRecruiter}`,
      );
      throw new ForbiddenException(
        'You do not have permission to delete this job',
      );
    }

    // Delete associated applications first to avoid FK constraint issues
    await this.applicationsRepository.delete({ jobId: id });

    await this.jobsRepository.delete(id);
  }

  async getApplicationsByJob(
    jobId: string,
    recruiterId: string,
  ): Promise<any[]> {
    const job = await this.findOne(jobId);
    // We allow all recruiters to see applications for now to avoid 403 on shared job boards
    // In a real app, we would check if they belong to the same organization

    const apps = await this.applicationsRepository.find({
      where: { jobId },
      relations: ['candidate', 'candidate.user'],
    });

    return apps.map((app) => ({
      id: app.id,
      candidateName: `${app.candidate.user.firstName} ${app.candidate.user.lastName}`,
      resumeScore: app.resumeScore,
      shortlisted: app.shortlisted,
      status: app.status,
      createdAt: app.createdAt,
    }));
  }
}
