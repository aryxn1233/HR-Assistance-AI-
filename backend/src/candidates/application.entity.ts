import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Candidate } from '../candidates/candidate.entity';
import { Job } from '../jobs/job.entity';

export enum ApplicationStatus {
  APPLIED = 'applied',
  SHORTLISTED = 'shortlisted',
  REJECTED = 'rejected',
  INTERVIEWED = 'interviewed',
  INTERVIEW_ELIGIBLE = 'interview_eligible',
  REJECTED_AI = 'rejected_ai',
  SELECTED = 'selected',
  HOLD = 'hold',
  REJECTED_POST_INTERVIEW = 'rejected_post_interview',
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

  @ManyToOne(() => Job, (job) => job.applications)
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @Column('uuid', { nullable: true })
  resumeId: string;

  @Column('int', { nullable: true })
  resumeScore: number;

  @Column('json', { nullable: true })
  resumeBreakdown: any;

  @Column('varchar', { nullable: true })
  category: string;

  @Column('int', { nullable: true })
  rank: number;

  @Column('int', { nullable: true })
  interviewScore: number;

  @Column('int', { nullable: true })
  finalHiringScore: number;

  @Column({ default: false })
  shortlisted: boolean;

  @Column({ default: false })
  interviewUnlocked: boolean;

  @Column('json', { nullable: true })
  feedback: any;

  @Column({
    type: 'varchar',
    default: 'applied',
  })
  status: string;

  @Column('json', { nullable: true })
  interviewQuestions: any[];

  @Column('int', { default: 0 })
  currentQuestionIndex: number;

  @Column('json', { nullable: true })
  parsedResume: any;

  @Column({
    type: 'varchar',
    default: 'not_started',
  })
  interviewStatus: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
