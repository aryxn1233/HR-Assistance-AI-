import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Candidate } from './candidate.entity';

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  candidateId: string;

  @ManyToOne(() => Candidate)
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column()
  fileUrl: string;

  @Column('text', { nullable: true })
  extractedText: string;

  @CreateDateColumn()
  uploadedAt: Date;
}
