import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum FallbackQuestionCategory {
    SKILL = 'skill',
    PROJECT = 'project',
    EXPERIENCE = 'experience'
}

export enum FallbackQuestionDifficulty {
    EASY = 'Easy',
    MEDIUM = 'Medium',
    HARD = 'Hard'
}

@Entity('fallback_questions')
export class FallbackQuestion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar')
    jobRole: string;

    @Column({
        type: 'enum',
        enum: FallbackQuestionCategory,
    })
    category: FallbackQuestionCategory;

    @Column('text')
    question: string;

    @Column({
        type: 'enum',
        enum: FallbackQuestionDifficulty,
    })
    difficulty: FallbackQuestionDifficulty;

    @Column('int')
    orderIndex: number;

    @CreateDateColumn()
    createdAt: Date;
}
