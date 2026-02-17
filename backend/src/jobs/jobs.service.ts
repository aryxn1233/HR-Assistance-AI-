import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';

@Injectable()
export class JobsService {
    constructor(
        @InjectRepository(Job)
        private jobsRepository: Repository<Job>,
    ) { }

    async create(createJobDto: any, recruiterId: string): Promise<Job> {
        const job = this.jobsRepository.create({ ...createJobDto, recruiterId });
        return this.jobsRepository.save(job) as unknown as Promise<Job>;
    }

    async findAll(): Promise<Job[]> {
        return this.jobsRepository.find();
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

    async remove(id: string): Promise<void> {
        await this.jobsRepository.delete(id);
    }
}
