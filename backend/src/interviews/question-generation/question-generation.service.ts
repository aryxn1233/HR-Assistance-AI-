import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../gemini/gemini.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QuestionGenerationService {
  private readonly logger = new Logger(QuestionGenerationService.name);

  constructor(
    private geminiService: GeminiService,
    private configService: ConfigService,
  ) {}

  async generate20Questions(
    parsedResume: any,
    skillMatch: any,
    jobTitle: string,
  ): Promise<string[]> {
    const useGemini = this.configService.get<string>('USE_GEMINI') === 'true';
    let questions: string[] = [];

    // 1. Internal Generation (Intro, 7 matched, 5 projects, 4 experience depth, 3 missing conceptual)
    const intro =
      "Hello! I'm your AI technical interviewer today. To get started, could you please introduce yourself and walk me through your professional background?";
    const matched = this.generateQuestionsFromSkills(
      skillMatch.matchedSkills,
      7,
      'matched',
    );
    const projects = this.generateQuestionsFromProjects(
      parsedResume.projects,
      5,
    );
    const depth = this.generateQuestionsFromDepth(skillMatch.extraSkills, 4);
    const missing = this.generateQuestionsFromSkills(
      skillMatch.missingSkills,
      3,
      'missing',
    );

    questions = [intro, ...matched, ...projects, ...depth, ...missing];

    // Ensure exactly 20
    while (questions.length < 20) {
      questions.push(
        `Can you explain your approach to keeping up with architectural trends in ${jobTitle}?`,
      );
    }
    questions = questions.slice(0, 20);

    // 2. Optional Gemini Refinement
    if (useGemini) {
      try {
        const refined = await this.geminiService.refineInterviewQuestions(
          questions,
          parsedResume,
          jobTitle,
        );
        if (refined && refined.length === 20) {
          return refined;
        }
      } catch (err) {
        this.logger.warn(
          'Gemini refinement failed, falling back to internal questions',
          err.message,
        );
      }
    }

    return questions;
  }

  private generateQuestionsFromSkills(
    skills: string[],
    count: number,
    type: 'matched' | 'missing',
  ): string[] {
    const questions: string[] = [];
    const matchedTemplates = [
      (s: string) =>
        `Explain how you have implemented or used ${s} in a production environment.`,
      (s: string) =>
        `Can you describe a challenging scenario where your knowledge of ${s} was critical?`,
      (s: string) =>
        `How do you handle performance optimization when working with ${s}?`,
      (s: string) =>
        `What are the top three best practices you follow when developing with ${s}?`,
      (s: string) =>
        `If you were to mentor a junior dev on ${s}, what core concepts would you emphasize?`,
      (s: string) =>
        `Walk me through the architecture of a system where you integrated ${s}.`,
      (s: string) =>
        `In your experience, what is the most misunderstood aspect of ${s}?`,
      (s: string) =>
        `How does ${s} fit into the overall lifecycle of a modern web application?`,
    ];

    const missingTemplates = [
      (s: string) =>
        `While it wasn't a focus in your profile, how do you understand ${s} in the context of high-scale systems?`,
      (s: string) =>
        `If our team uses ${s} heavily, how would you approach getting up to speed with it?`,
      (s: string) =>
        `Can you explain the theoretical trade-offs between ${s} and other similar technologies?`,
      (s: string) =>
        `How would you architect a basic solution using ${s} if required for a specific module?`,
      (s: string) =>
        `From a conceptual standpoint, what role does ${s} play in solving common backend bottlenecks?`,
    ];

    for (let i = 0; i < count; i++) {
      const skill = skills[i % skills.length] || 'modern software development';
      const templates =
        type === 'matched' ? matchedTemplates : missingTemplates;
      const template = templates[i % templates.length];
      questions.push(template(skill));
    }
    return questions;
  }

  private generateQuestionsFromProjects(
    projects: any[],
    count: number,
  ): string[] {
    const questions: string[] = [];
    const projectTemplates = [
      (p: string) =>
        `In your work on "${p}", what were the biggest technical hurdles you faced and how did you resolve them?`,
      (p: string) =>
        `Regarding the "${p}" project, if you had to start it over today, what architectural choices would you change?`,
      (p: string) =>
        `What was the most rewarding technical achievement you reached during the "${p}" development?`,
      (p: string) =>
        `How did you ensure the scalability and reliability of the "${p}" system under load?`,
      (p: string) =>
        `Describe the stack you used for "${p}" and why those specific tools were selected.`,
    ];

    for (let i = 0; i < count; i++) {
      const project = projects[i % projects.length];
      if (project) {
        const template = projectTemplates[i % projectTemplates.length];
        questions.push(template(project.name));
      } else {
        questions.push(
          `Describe a recent technical project where you had to lead a significant architectural decision.`,
        );
      }
    }
    return questions;
  }

  private generateQuestionsFromDepth(
    extraSkills: string[],
    count: number,
  ): string[] {
    const questions: string[] = [];
    const depthTemplates = [
      (s: string) =>
        `Deep dive into ${s}: what are the common pitfalls you've encountered and how do you mitigate them?`,
      (s: string) =>
        `Let's discuss advanced ${s} concepts: how do you balance speed vs. maintainability in this context?`,
      (s: string) =>
        `Explain the internal mechanics of ${s} that most developers overlook.`,
      (s: string) =>
        `How do you troubleshoot complex, non-obvious bugs related to ${s}?`,
      (s: string) =>
        `What exciting trends or updates in the ${s} ecosystem are you currently following?`,
    ];

    for (let i = 0; i < count; i++) {
      const skill = extraSkills[i % extraSkills.length] || 'system design';
      const template = depthTemplates[i % depthTemplates.length];
      questions.push(template(skill));
    }
    return questions;
  }
}
