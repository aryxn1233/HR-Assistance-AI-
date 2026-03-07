import { Injectable } from '@nestjs/common';

@Injectable()
export class SkillMatchingService {
  match(jobSkills: string[], resumeSkills: string[]): any {
    const normalizedJobSkills = jobSkills.map((s) => s.toLowerCase());
    const normalizedResumeSkills = resumeSkills.map((s) => s.toLowerCase());

    const matchedSkills = normalizedJobSkills.filter((skill) =>
      normalizedResumeSkills.some(
        (rs) => rs.includes(skill) || skill.includes(rs),
      ),
    );

    const missingSkills = normalizedJobSkills.filter(
      (skill) => !matchedSkills.includes(skill),
    );

    const extraSkills = normalizedResumeSkills.filter(
      (skill) =>
        !normalizedJobSkills.some(
          (js) => js.includes(skill) || skill.includes(js),
        ),
    );

    return {
      matchedSkills: matchedSkills.map(
        (s) => s.charAt(0).toUpperCase() + s.slice(1),
      ),
      missingSkills: missingSkills.map(
        (s) => s.charAt(0).toUpperCase() + s.slice(1),
      ),
      extraSkills: extraSkills
        .slice(0, 5)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    };
  }
}
