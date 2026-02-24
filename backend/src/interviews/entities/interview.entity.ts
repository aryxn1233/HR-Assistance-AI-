import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Candidate } from '../../candidates/candidate.entity';
import { Job } from '../../jobs/job.entity';
import { Application } from '../../candidates/application.entity';
import { InterviewQuestion } from './interview-question.entity';
import { InterviewReport } from './interview-report.entity';

export enum InterviewStatus {
    CREATED = 'created',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Entity('interviews')
export class Interview {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { nullable: true })
    applicationId: string;

    @ManyToOne(() => Application)
    @JoinColumn({ name: 'applicationId' })
    application: Application;

    @Column({ default: false })
    completed: boolean;

    @Column('uuid')
    jobId: string;

    @ManyToOne(() => Job)
    @JoinColumn({ name: 'jobId' })
    job: Job;

    @Column('uuid')
    candidateId: string;

    @ManyToOne(() => Candidate)
    @JoinColumn({ name: 'candidateId' })
    candidate: Candidate;

    @Column({
        type: 'varchar',
        default: InterviewStatus.CREATED,
    })
    status: string;

    @Column({ type: 'int', default: 0 })
    score: number;

    @Column({ type: 'int', default: 0 })
    currentQuestionIndex: number;

    @OneToMany(() => InterviewQuestion, (question) => question.interview)
    questions: InterviewQuestion[];

    @OneToOne(() => InterviewReport, (report) => report.interview)
    report: InterviewReport;

    @Column('jsonb', { nullable: true })
    feedback: any;

    @Column('jsonb', { nullable: true, default: [] })
    transcript: { speaker: 'AI' | 'Candidate'; message: string; timestamp: Date }[];

    @Column('jsonb', { nullable: true, default: [] })
    history: { role: string; content: string }[];

    @Column({ type: 'varchar', nullable: true })
    fitDecision: string;

    @Column({ type: 'int', nullable: true })
    joinProbability: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

