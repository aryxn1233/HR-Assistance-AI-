import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Interview } from './interview.entity';

export enum HiringRecommendation {
  STRONG_HIRE = 'Strong Hire',
  HIRE = 'Hire',
  NO_HIRE = 'No Hire',
}

@Entity('interview_reports')
export class InterviewReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  interviewId: string;

  @OneToOne(() => Interview)
  @JoinColumn({ name: 'interviewId' })
  interview: Interview;

  @Column('float')
  overallScore: number;

  @Column('jsonb', { nullable: true })
  strengths: string[];

  @Column('jsonb', { nullable: true })
  weaknesses: string[];

  @Column({
    type: 'enum',
    enum: HiringRecommendation,
  })
  recommendation: HiringRecommendation;

  @Column('jsonb', { nullable: true })
  detailedAnalysis: any;

  @CreateDateColumn()
  createdAt: Date;
}
