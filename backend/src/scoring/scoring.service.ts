import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class ScoringService {
    private openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    async evaluateResume(resumeText: string, jobDescription: string) {
        const prompt = `
You are a startup-style technical recruiter who is flexible and looking for potential.
Evaluate the following resume against the job description.

Do not overly penalize minor skill gaps if the candidate shows strong project relevance or experience.
Focus on "startup-friendly" traits: project impact, relevant technologies, and transferable skills.

Return ONLY a structured JSON response with the following format:
{
  "skillMatch": number (0-100),
  "experienceMatch": number (0-100),
  "projectRelevance": number (0-100),
  "educationRelevance": number (0-100),
  "overallScore": number (0-100),
  "breakdown": {
    "skills": "reasoning for skill match",
    "experience": "reasoning for experience match",
    "projects": "reasoning for project relevance",
    "education": "reasoning for education relevance"
  },
  "strengths": string[],
  "weaknesses": string[]
}

Job Description:
${jobDescription}

Resume:
${resumeText}
`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
            });

            const content = response.choices[0].message.content;
            const aiResult = this.parseAIResult(content || '{}');

            if (!aiResult) {
                console.warn('AI result parsing failed, using fallback.');
                return this.calculateFinalScore(this.getFallbackScore(resumeText, jobDescription));
            }

            return this.calculateFinalScore(aiResult);
        } catch (error) {
            console.error('Error evaluating resume with OpenAI:', error.message);
            // Fallback scoring to prevent 500 errors
            console.log('Using fallback scoring mechanism due to AI error.');
            const fallbackResult = this.getFallbackScore(resumeText, jobDescription);
            return this.calculateFinalScore(fallbackResult);
        }
    }

    private parseAIResult(content: string): any {
        try {
            // Remove markdown code blocks if present
            const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```([\s\S]*?)```/);
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

        // Basic heuristic: match common technical keywords
        const keywords = ['javascript', 'typescript', 'react', 'node', 'nest', 'python', 'java', 'sql', 'docker', 'aws', 'cloud', 'frontend', 'backend', 'fullstack', 'api', 'devops'];
        let matches = 0;
        keywords.forEach(kw => {
            if (resumeLower.includes(kw) && descLower.includes(kw)) matches++;
        });

        const matchScore = Math.min(50 + (matches * 5), 90);

        return {
            skillMatch: matchScore,
            experienceMatch: matchScore,
            projectRelevance: matchScore,
            educationRelevance: 70,
            overallScore: matchScore,
            breakdown: {
                skills: "Basic keyword match fallback used.",
                experience: "Automated heuristic evaluation.",
                projects: "Project relevance estimated from keyword synergy.",
                education: "General education weight applied."
            },
            strengths: ["Technical background matches job keywords"],
            weaknesses: ["AI-powered deep analysis currently unavailable"]
        };
    }

    private calculateFinalScore(aiResult: any) {
        const { skillMatch, experienceMatch, projectRelevance, educationRelevance, overallScore } = aiResult;

        // Weighted Score logic
        let score =
            skillMatch * 0.30 +
            experienceMatch * 0.20 +
            projectRelevance * 0.20 +
            educationRelevance * 0.10 +
            overallScore * 0.20;

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
