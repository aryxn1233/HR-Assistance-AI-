import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface QuestionData {
  question: string;
  skillFocus: string;
  difficulty: string;
}

export interface EvaluationData {
  technicalScore: number;
  accuracyScore: number;
  communicationScore: number;
  confidenceScore: number;
  feedback: string;
}

export interface ReportData {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  detailedAnalysis: any;
}

@Injectable()
export class GeminiService {
  private models: GenerativeModel[] = [];
  private currentKeyIndex = 0;

  constructor(private configService: ConfigService) {
    const keys = [
      this.configService.get<string>('GEMINI_API_KEY'),
      this.configService.get<string>('GEMINI_API_KEY2'),
      this.configService.get<string>('GEMINI_API_KEY3'),
      this.configService.get<string>('GEMINI_API_KEY4'),
      this.configService.get<string>('GEMINI_API_KEY5'),
    ].filter((k) => !!k) as string[];

    if (keys.length === 0) {
      console.warn('No GEMINI_API_KEYs found in environment variables');
    } else {
      this.models = keys.map((key) => {
        const genAI = new GoogleGenerativeAI(key);
        return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      });
      console.log(
        `Initialized GeminiService with ${this.models.length} API keys.`,
      );
    }
  }

  private async runWithRotation<T>(
    action: (model: GenerativeModel) => Promise<T>,
    fallback: T,
  ): Promise<T> {
    let attempts = 0;
    const maxAttempts = this.models.length;

    if (maxAttempts === 0) {
      throw new Error('Gemini models not initialized. Check API Keys.');
    }

    while (attempts < maxAttempts) {
      const model = this.models[this.currentKeyIndex];
      try {
        return await action(model);
      } catch (error: any) {
        attempts++;
        console.error(
          `Error with Gemini Key #${this.currentKeyIndex + 1}: ${error.message}`,
        );

        // Check for rate limit (429) or other retryable errors
        const isRetryable =
          error.message?.includes('429') ||
          error.status === 429 ||
          error.status >= 500;

        if (isRetryable && attempts < maxAttempts) {
          this.currentKeyIndex =
            (this.currentKeyIndex + 1) % this.models.length;
          console.warn(
            `Switching to Gemini API Key #${this.currentKeyIndex + 1} (Attempt ${attempts + 1}/${maxAttempts})`,
          );
          continue;
        }

        // If we've exhausted keys or error is not retryable, use fallback or throw
        break;
      }
    }

    console.warn('Gemini exhausted all keys, using fallback.');
    return fallback;
  }

  private fallbackQuestions: (QuestionData & { isComplete: boolean })[] = [
    {
      question: 'Tell me about yourself and your professional background.',
      skillFocus: 'Communication',
      difficulty: 'Easy',
      isComplete: false,
    },
    {
      question:
        'What is your greatest professional achievement and what was your specific role in it?',
      skillFocus: 'Behavioral',
      difficulty: 'Medium',
      isComplete: false,
    },
    {
      question:
        'Describe a situation where you had to solve a complex technical problem. How did you approach it?',
      skillFocus: 'Problem Solving',
      difficulty: 'Medium',
      isComplete: false,
    },
    {
      question:
        'How do you handle disagreements with team members or managers?',
      skillFocus: 'Behavioral',
      difficulty: 'Medium',
      isComplete: false,
    },
    {
      question:
        'What key technologies or tools are you most proficient with, and how have you used them in recent projects?',
      skillFocus: 'Technical',
      difficulty: 'Medium',
      isComplete: false,
    },
    {
      question:
        'Where do you see yourself professionally in the next 3–5 years?',
      skillFocus: 'Career Goals',
      difficulty: 'Easy',
      isComplete: false,
    },
    {
      question:
        'Describe a project where you had to learn a new skill quickly. How did you manage it?',
      skillFocus: 'Adaptability',
      difficulty: 'Medium',
      isComplete: false,
    },
    {
      question:
        'How do you prioritize tasks when managing multiple projects simultaneously?',
      skillFocus: 'Time Management',
      difficulty: 'Medium',
      isComplete: false,
    },
    {
      question:
        'This role may require relocation to Bangalore. Are you open to that?',
      skillFocus: 'Logistics',
      difficulty: 'Easy',
      isComplete: false,
    },
    {
      question: 'What are your salary expectations, and how flexible are you?',
      skillFocus: 'Negotiation',
      difficulty: 'Easy',
      isComplete: false,
    },
    {
      question:
        'Do you have any questions for us about the role or the company?',
      skillFocus: 'Engagement',
      difficulty: 'Easy',
      isComplete: false,
    },
  ];

  async generateQuestion(context: any): Promise<QuestionData> {
    const prompt = `
            You are a Senior Technical Interviewer conducting a mock interview for a software engineering position.
            Your goal is to evaluate the candidate's technical skills and communication.

            Guidelines:
            1. Be professional but encouraging.
            2. Ask only ONE technical question at a time.
            3. If the user provides an answer, give brief feedback and then ask the next follow-up or a new question.
            4. Stay focused on technical topics (JavaScript, React, Node.js, Systems Design, etc.).
            5. Keep your responses concise (max 3 sentences) so the avatar remains engaging.
            6. End interview after significant evaluation (~8-10 exchanges).
            7. When interview is complete, say: "INTERVIEW_COMPLETE. [Closing Message]"

            Context:
            - Job Description: ${JSON.stringify(context.jobDescription)}
            - Candidate Resume: ${JSON.stringify(context.resume)}
            - Previous Questions/Answers: ${JSON.stringify(context.history || [])}

            Return ONLY valid JSON in this format:
            {
                "question": "string",
                "skillFocus": "string",
                "difficulty": "Easy | Medium | Hard",
                "isComplete": boolean (set true ONLY if you said INTERVIEW_COMPLETE)
            }
        `;

    const historyLen = (context.history || []).length;
    const fallback =
      historyLen < this.fallbackQuestions.length
        ? this.fallbackQuestions[historyLen]
        : ({
            question: '',
            skillFocus: 'Wrap-up',
            difficulty: 'Easy',
            isComplete: true,
          } as any);

    return this.runWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      return this.cleanJson(result.response.text()) as QuestionData;
    }, fallback);
  }

  async evaluateAnswer(
    question: string,
    answer: string,
  ): Promise<EvaluationData> {
    const prompt = `
            Evaluate the following interview answer.
            Question: "${question}"
            Answer: "${answer}"

            Score on scale 0-10:
            - Technical depth
            - Accuracy
            - Communication clarity
            - Confidence

            Return ONLY valid JSON:
            {
                "technicalScore": number,
                "accuracyScore": number,
                "communicationScore": number,
                "confidenceScore": number,
                "feedback": "string (concise feedback)"
            }
        `;

    const fallback: EvaluationData = {
      technicalScore: 0,
      accuracyScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      feedback:
        'Answer recorded but AI evaluation encountered a temporary issue.',
    };

    return this.runWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      return this.cleanJson(result.response.text()) as EvaluationData;
    }, fallback);
  }

  async generateReport(interviewData: any): Promise<any> {
    const prompt = `
            You are an Expert Technical Recruiter. Analyze the following interview transcript and provide a detailed report.
            
            Conversation History:
            ${JSON.stringify(interviewData.messages)}

            Your report MUST follow this exact format in the "detailed_feedback" field:
            Score: [Number from 0 to 100]
            Feedback: [3-4 sentences summarizing technical performance and communication]
            Strengths: [Bullet points of what they did well]
            Areas for Improvement: [Bullet points of what to work on]

            Return ONLY valid JSON format:
            {
              "overall_rating": 0-10,
              "technical_score": 0-10,
              "communication_score": 0-10,
              "problem_solving_score": 0-10,
              "behavioral_score": 0-10,
              "culture_fit_score": 0-10,
              "strengths": ["string"],
              "weaknesses": ["string"],
              "detailed_feedback": "FULL FORMATTED REPORT AS DESCRIBED ABOVE",
              "fit_for_role": "YES" | "NO",
              "joining_probability_percent": 0-100
            }
        `;

    const fallback = {
      technical_score: 0,
      communication_score: 0,
      problem_solving_score: 0,
      behavioral_score: 0,
      culture_fit_score: 0,
      overall_rating: 0,
      strengths: ['Interview record available'],
      weaknesses: ['Interview too short or AI evaluation service unavailable'],
      detailed_feedback:
        'Score: 0\nFeedback: The interview was either too short to evaluate or the AI service encountered an error. Manual review of the transcript is recommended.',
      fit_for_role: 'NO',
      confidence_level: 'Low',
      joining_probability_percent: 0,
      joining_reasoning: 'Incomplete or failed AI analysis.',
    };

    return this.runWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      return this.cleanJson(result.response.text());
    }, fallback);
  }

  async refineInterviewQuestions(
    questions: string[],
    resume: any,
    jobTitle: string,
  ): Promise<string[]> {
    const prompt = `
            You are a Senior Technical Recruiter. I have a list of 20 interview questions for a ${jobTitle} position.
            Candidate Summary: ${JSON.stringify(resume)}

            Original Questions:
            ${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

            Tasks:
            1. Improve the phrasing to be more professional, natural, and diverse.
            2. Increase the technical depth based on the candidate's specific background.
            3. Ensure each question is a SINGLE technical question (no combined questions).
            4. **CRITICAL: DO NOT start every question with the same phrase.**
               - BAD: "Explain how you...", "Explain how you..."
               - GOOD: Vary your openers: "Walk me through...", "How do you approach...", "In your experience with...", "Tell me about...", "Describe a time when..."
            5. Keep exactly 20 questions.
            6. Return ONLY a JSON array of strings.

            Format: ["Question 1", "Question 2", ...]
        `;

    const fallback = questions;

    return this.runWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = this.cleanJson(text);
      if (Array.isArray(cleaned) && cleaned.length === 20) {
        return cleaned;
      }
      return fallback;
    }, fallback);
  }

  private cleanJson(text: string): any {
    try {
      // Remove markdown code blocks if present
      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      // Try to find the first [ and last ]
      const start = cleaned.indexOf('[');
      const end = cleaned.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        return JSON.parse(cleaned.substring(start, end + 1));
      }
      // For objects
      const objStart = cleaned.indexOf('{');
      const objEnd = cleaned.lastIndexOf('}');
      if (objStart !== -1 && objEnd !== -1) {
        return JSON.parse(cleaned.substring(objStart, objEnd + 1));
      }
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse Gemini JSON response:', text);
      throw new Error('Invalid JSON from AI');
    }
  }
}
