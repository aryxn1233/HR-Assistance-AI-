import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { InterviewQuestion } from './interview-question.entity';

@Entity('interview_answers')
export class InterviewAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  questionId: string;

  @OneToOne(() => InterviewQuestion)
  @JoinColumn({ name: 'questionId' })
  question: InterviewQuestion;

  @Column('text')
  transcript: string;

  @Column('float', { default: 0 })
  technicalScore: number;

  @Column('float', { default: 0 })
  accuracyScore: number;

  @Column('float', { default: 0 })
  communicationScore: number;

  @Column('float', { default: 0 })
  confidenceScore: number;

  @Column('text', { nullable: true })
  feedback: string;

  @CreateDateColumn()
  createdAt: Date;
}
