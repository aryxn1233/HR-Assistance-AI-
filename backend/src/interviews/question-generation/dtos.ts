export interface ParsedResumeDto {
    skills: string[];
    projects: ProjectDto[];
    experience: number;
    rawText: string;
}

export interface ProjectDto {
    name: string;
    description: string;
}

export interface SkillMatchDto {
    matchedSkills: string[];
    missingSkills: string[];
    extraSkills: string[];
}

export enum InterviewProgressStatus {
    NOT_STARTED = 'not_started',
    READY = 'ready',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed'
}
