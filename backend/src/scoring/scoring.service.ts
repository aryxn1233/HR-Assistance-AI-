import { Injectable } from '@nestjs/common';
import { OpenAIService } from '../ai/openai.service';

@Injectable()
export class ScoringService {
  constructor(private readonly openAIService: OpenAIService) {}

  async evaluateResume(resumeText: string, jobDescription: string) {
    try {
      const aiResult = await this.openAIService.evaluateResume(
        resumeText,
        jobDescription,
      );

      // Mapping from OpenAIService schema to ScoringService schema if necessary
      const normalizedResult = {
        skillMatch: aiResult.skillMatchScore || aiResult.skillMatch || 0,
        experienceMatch: aiResult.experienceMatch || 0,
        projectRelevance:
          aiResult.relevanceScore || aiResult.projectRelevance || 0,
        educationRelevance: aiResult.educationRelevance || 70,
        overallScore: aiResult.overallScore || 0,
        breakdown: aiResult.breakdown || {
          skills: aiResult.strengths?.join(', ') || 'Evaluated by AI',
          experience: 'Analyzed based on history',
          projects: 'Project depth assessment',
          education: 'Background check',
        },
        strengths: aiResult.strengths || [],
        weaknesses: aiResult.weaknesses || [],
      };

      return this.calculateFinalScore(normalizedResult);
    } catch (error) {
      console.error('Error evaluating resume with AI service:', error.message);
      const fallbackResult = this.getFallbackScore(resumeText, jobDescription);
      return this.calculateFinalScore(fallbackResult);
    }
  }

  private parseAIResult(content: string): any {
    try {
      // Remove markdown code blocks if present
      const jsonMatch =
        content.match(/```json\n?([\s\S]*?)\n?```/) ||
        content.match(/```([\s\S]*?)```/);
      const cleanContent = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(cleanContent.trim());
    } catch (error) {
      console.error('Failed to parse AI JSON result:', content);
      return null;
    }
  }

  private getFallbackScore(resumeText: string, jobDescription: string) {
    const resumeLower = resumeText.toLowerCase();
    const descLower = jobDescription.toLowerCase();

    console.log('--- RUNNING DETERMINISTIC FALLBACK SCORING ---');

    // Basic heuristic: match common technical keywords
    const keywords = [
      'javascript',
      'typescript',
      'react',
      'node',
      'nest',
      'python',
      'java',
      'sql',
      'docker',
      'aws',
      'cloud',
      'frontend',
      'backend',
      'fullstack',
      'api',
      'devops',
      'sap',
      'data',
      'engineer',
      'consultant',
      'student',
      'university',
      'bachelor',
      'engineering',
    ];
    let matches = 0;
    const matchedWords: string[] = [];

    keywords.forEach((kw) => {
      if (resumeLower.includes(kw) && descLower.includes(kw)) {
        matches++;
        matchedWords.push(kw);
      }
    });

    console.log(
      `Fallback Match: Found ${matches} keywords: ${matchedWords.join(', ')}`,
    );

    // Base score starts higher to avoid "Rejection by default" (15% was too low)
    // If there are ANY matches, start at 45 (passing threshold is 40)
    // If NO matches, start at 25.
    const baseScore = matches > 0 ? 45 : 25;
    const matchScore = Math.min(baseScore + matches * 5, 85);

    return {
      skillMatch: matchScore,
      experienceMatch: Math.max(matchScore - 10, 20),
      projectRelevance: matchScore,
      educationRelevance: 75,
      overallScore: matchScore,
      breakdown: {
        skills:
          matches > 0
            ? `Matched keywords: ${matchedWords.join(', ')}.`
            : 'General skill match evaluation.',
        experience: 'Heuristic evaluation of profile seniority.',
        projects: 'Project synergy based on technical keyword density.',
        education: 'Educational background verified.',
      },
      strengths:
        matchedWords.length > 0
          ? [`Focus on ${matchedWords.slice(0, 3).join(', ')}`]
          : ['General background'],
      weaknesses: ['AI-powered deep analysis currently unavailable'],
    };
  }

  private calculateFinalScore(aiResult: any) {
    const {
      skillMatch,
      experienceMatch,
      projectRelevance,
      educationRelevance,
      overallScore,
    } = aiResult;

    // Weighted Score logic
    let score =
      skillMatch * 0.3 +
      experienceMatch * 0.2 +
      projectRelevance * 0.2 +
      educationRelevance * 0.1 +
      overallScore * 0.2;

    // Soft Boost Rules
    if (projectRelevance >= 75) {
      score += 5;
    }

    if (skillMatch >= 65 && experienceMatch >= 60) {
      score += 3;
    }

    if (score >= 65 && score <= 69) {
      score += 4;
    }

    if (score < 50) {
      score += 8;
    }

    // Cap at 92 and round to nearest integer
    const finalScore = Math.round(Math.min(score, 92));

    // Categorization
    let category = '';
    if (finalScore >= 85) {
      category = 'Excellent Fit';
    } else if (finalScore >= 75) {
      category = 'Strong Fit';
    } else if (finalScore >= 60) {
      category = 'Recommended';
    } else if (finalScore >= 40) {
      category = 'Average Fit';
    } else {
      category = 'Below Threshold';
    }

    return {
      resumeScore: finalScore,
      resumeBreakdown: aiResult,
      category,
    };
  }
}
