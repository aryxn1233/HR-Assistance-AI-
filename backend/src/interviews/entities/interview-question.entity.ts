import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Interview } from './interview.entity';

export enum QuestionDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

@Entity('interview_questions')
export class InterviewQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  interviewId: string;

  @ManyToOne(() => Interview, (interview) => interview.questions)
  @JoinColumn({ name: 'interviewId' })
  interview: Interview;

  @Column('text')
  questionText: string;

  @Column()
  skillFocus: string;

  @Column({
    type: 'enum',
    enum: QuestionDifficulty,
  })
  difficulty: QuestionDifficulty;

  @Column('int')
  orderNumber: number;

  @CreateDateColumn()
  createdAt: Date;
}
