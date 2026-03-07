import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Application } from '../candidates/application.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Application, (application) => application.job)
  applications: Application[];

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: 'Full-time' })
  type: string;

  @Column('simple-array', { nullable: true })
  requiredSkills: string[];

  @Column('float', { default: 0 })
  minExperience: number;

  @Column({ default: 'Active' })
  status: string;

  @Column('uuid', { nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
