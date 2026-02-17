import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('jobs')
export class Job {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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
    skills: string[];

    @Column('float', { default: 0 })
    minExperience: number;

    @Column({ default: 'Active' })
    status: string;

    @Column('uuid') // Ideally relationship to User entity
    recruiterId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
