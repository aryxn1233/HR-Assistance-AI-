import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Candidate } from './candidate.entity';

@Entity('candidate_experiences')
export class CandidateExperience {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    candidateId: string;

    @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'candidateId' })
    candidate: Candidate;

    @Column()
    employer: string;

    @Column()
    role: string;

    @Column({ type: 'date' })
    startDate: Date;

    @Column({ type: 'date', nullable: true })
    endDate: Date; // Null means currently working here

    @Column({ default: false })
    isCurrent: boolean;

    @Column('text', { nullable: true })
    description: string;

    @Column({ nullable: true })
    location: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
