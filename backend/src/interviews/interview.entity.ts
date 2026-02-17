import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Candidate } from '../candidates/candidate.entity';
import { Job } from '../jobs/job.entity';

export enum InterviewStatus {
    SCHEDULED = 'Scheduled',
    IN_PROGRESS = 'In Progress',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
}

@Entity('interviews')
export class Interview {
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
        enum: InterviewStatus,
        default: InterviewStatus.SCHEDULED,
    })
    status: InterviewStatus;

    @Column({ type: 'int', default: 0 })
    score: number;

    @Column('jsonb', { nullable: true })
    feedback: any;

    @Column('text', { nullable: true })
    transcript: string;

    @Column('jsonb', { nullable: true, default: [] })
    history: { role: string; content: string }[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
