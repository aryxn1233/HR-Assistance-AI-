import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { CandidateExperience } from './experience.entity';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => CandidateExperience, (experience) => experience.candidate)
  experiences: CandidateExperience[];

  @Column({ nullable: true })
  resumeUrl: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  title: string;

  @Column('text', { nullable: true })
  bio: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  linkedinUrl: string;

  @Column({ nullable: true })
  portfolioUrl: string;

  @Column('text', { nullable: true })
  resumeText: string;

  @Column('simple-array', { nullable: true })
  skills: string[];

  @Column('float', { default: 0 })
  experienceYears: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
