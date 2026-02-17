import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Candidate } from '../candidates/candidate.entity';
import { Job } from '../jobs/job.entity';

export enum ApplicationStatus {
    APPLIED = 'Applied',
    SCREENING = 'Screening',
    INTERVIEWING = 'Interviewing',
    SHORTLISTED = 'Shortlisted',
    REJECTED = 'Rejected',
    OFFER_EXTENDED = 'Offer Extended',
}

@Entity('applications')
export class Application {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    candidateId: string;

    @ManyToOne(() => Candidate)
    @JoinColumn({ name: 'candidateId' })
    candidate: Candidate;

    @Column('uuid')
    jobId: string;

    @ManyToOne(() => Job)
    @JoinColumn({ name: 'jobId' })
    job: Job;

    @Column({
        type: 'enum',
        enum: ApplicationStatus,
        default: ApplicationStatus.APPLIED,
    })
    status: ApplicationStatus;

    @Column({ type: 'int', default: 0 })
    aiScore: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
