import { Injectable } from '@nestjs/common';

@Injectable()
export class ResumeParserService {
  async parse(resumeText: string): Promise<any> {
    const text = resumeText.toLowerCase();

    const skills = this.extractSkills(text);
    const projects = this.extractProjects(resumeText);
    const experience = this.extractExperience(text);

    return {
      skills,
      projects,
      experience,
      rawText: resumeText,
    };
  }

  private extractSkills(text: string): string[] {
    const commonSkills = [
      'javascript',
      'typescript',
      'react',
      'nodejs',
      'nextjs',
      'nestjs',
      'python',
      'java',
      'sql',
      'postgresql',
      'mongodb',
      'docker',
      'aws',
      'azure',
      'ai',
      'machine learning',
      'blockchain',
      'golang',
      'rust',
      'c++',
      'c#',
      'php',
      'laravel',
      'django',
      'flask',
      'vue',
      'angular',
      'redux',
      'tailwind',
      'kubernetes',
      'terraform',
      'graphql',
      'rest api',
      'microservices',
    ];
    return commonSkills.filter((skill) => text.includes(skill));
  }

  private extractProjects(text: string): any[] {
    // Look for project-like sections or bullet points
    const projects: any[] = [];
    const lines = text.split('\n');

    // Simple heuristic: lines starting with "Project:" or containing "System" during a project section
    let inProjects = false;
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('project') || lowerLine.includes('experience')) {
        inProjects = true;
        continue;
      }
      if (
        inProjects &&
        line.trim().length > 20 &&
        (line.includes(':') || line.startsWith('-') || line.startsWith('*'))
      ) {
        projects.push({
          name: line.split(':')[0].replace(/[-*]/g, '').trim(),
          description: line.trim(),
        });
      }
      if (projects.length >= 5) break;
    }

    return projects.length > 0
      ? projects
      : [
          {
            name: 'Personal Projects',
            description: 'Assorted development work',
          },
        ];
  }

  private extractExperience(text: string): number {
    const expMatch = text.match(/(\d+)\s*(?:years|yr|years of experience)/i);
    return expMatch ? parseInt(expMatch[1]) : 0;
  }
}
