/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import OpenAI from 'openai';

// ─────────────────────────────────────────────
//  Public Interfaces
// ─────────────────────────────────────────────

export interface QuestionData {
  question: string;
  skillFocus: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isComplete: boolean;
}

export interface EvaluationData {
  technicalScore: number;
  accuracyScore: number;
  communicationScore: number;
  confidenceScore: number;
  feedback: string;
  improvementTip: string;
}

export interface BehaviorAnalysis {
  isProfessional: boolean;
  severity: 'clean' | 'mild' | 'abusive' | 'harassment';
  penalty: number;
  closingMessage: string | null;
}

export interface InterviewReportData {
  overall_rating: number;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  behavioral_score: number;
  culture_fit_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'Hire' | 'Lean Hire' | 'No Hire';
  summary: string;
}

export interface ReportData {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  detailedAnalysis: any;
}

// ─────────────────────────────────────────────
//  Interview Stage Tracker
// ─────────────────────────────────────────────

const INTERVIEW_STAGES = [
  'Warm-up / Introduction',
  'Resume-based question',
  'Technical Fundamentals',
  'Deeper Technical Follow-up',
  'Scenario / System Design',
  'Problem-solving Challenge',
  'Behavioral / Teamwork',
  'Closing',
] as const;

type InterviewStage = (typeof INTERVIEW_STAGES)[number];

// ─────────────────────────────────────────────
//  GeminiService
// ─────────────────────────────────────────────

@Injectable()
export class GeminiService {
  private models: GenerativeModel[] = [];
  private currentKeyIndex = 0;
  private openRouter: OpenAI | null = null;

  constructor(private configService: ConfigService) {
    const keys = [
      this.configService.get<string>('GEMINI_API_KEY'),
      this.configService.get<string>('GEMINI_API_KEY2'),
      this.configService.get<string>('GEMINI_API_KEY3'),
      this.configService.get<string>('GEMINI_API_KEY4'),
      this.configService.get<string>('GEMINI_API_KEY5'),
    ].filter((k): k is string => !!k);

    if (keys.length === 0) {
      console.warn('⚠️  No GEMINI_API_KEYs found in environment variables');
    } else {
      this.models = keys.map((key) => {
        const genAI = new GoogleGenerativeAI(key);
        return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      });
      console.log(
        `✅  GeminiService initialized with ${this.models.length} API key(s).`,
      );
    }

    const openRouterKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (openRouterKey) {
      this.openRouter = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: openRouterKey,
        defaultHeaders: {
          'HTTP-Referer': 'https://hire-me.site',
          'X-Title': 'AI Hiring Platform',
        },
      });
      console.log('✅  OpenRouter fallback system initialized.');
    }
  }

  // ───────────────────────────────────────────
  //  API Key Rotation Core
  // ───────────────────────────────────────────

  private async runWithRotation<T>(
    action: (model: GenerativeModel) => Promise<T>,
    fallback: T,
    promptForOpenRouter?: string,
  ): Promise<T> {
    if (this.models.length === 0 && !this.openRouter) {
      console.error('AI models not initialized. Check API Keys.');
      return fallback;
    }

    let attempts = 0;
    const maxAttempts = this.models.length;

    while (attempts < maxAttempts) {
      const model = this.models[this.currentKeyIndex];
      try {
        return await action(model);
      } catch (error: any) {
        attempts++;
        console.error(
          `❌  Gemini Key #${this.currentKeyIndex + 1} error: ${error?.message}`,
        );

        const isRetryable =
          error?.message?.includes('429') ||
          error?.status === 429 ||
          (error?.status ?? 0) >= 500;

        if (isRetryable && attempts < maxAttempts) {
          this.currentKeyIndex =
            (this.currentKeyIndex + 1) % this.models.length;
          console.warn(
            `🔄  Rotating to Gemini API Key #${this.currentKeyIndex + 1} (attempt ${attempts + 1}/${maxAttempts})`,
          );
          continue;
        }

        break;
      }
    }

    if (this.openRouter && promptForOpenRouter) {
      console.warn('🔄  All Gemini keys failed. Attempting OpenRouter fallback...');
      try {
        const response = await this.openRouter.chat.completions.create({
          model: 'google/gemini-2.0-flash-001',
          messages: [{ role: 'user', content: promptForOpenRouter }],
        });
        const text = response.choices[0].message.content;
        if (text) {
          if (typeof fallback === 'string') return text as any;
          return this.cleanJson(text) as T;
        }
      } catch (e: any) {
        console.error(`❌  OpenRouter fallback failed: ${e.message}`);
      }
    }

    console.warn('⚠️  All AI providers exhausted — using fallback response.');
    return fallback;
  }

  // ───────────────────────────────────────────
  //  Adaptive Difficulty Engine
  // ───────────────────────────────────────────

  private computeDifficulty(
    evaluations: EvaluationData[],
  ): 'Easy' | 'Medium' | 'Hard' {
    if (evaluations.length === 0) return 'Medium';

    const avgScore =
      evaluations.reduce((sum, e) => {
        const score =
          (e.technicalScore +
            e.accuracyScore +
            e.communicationScore +
            e.confidenceScore) /
          4;
        return sum + score;
      }, 0) / evaluations.length;

    if (avgScore >= 7) return 'Hard';
    if (avgScore >= 4) return 'Medium';
    return 'Easy';
  }

  private applyHardQuestionBonus(
    evaluation: EvaluationData,
    difficulty: 'Easy' | 'Medium' | 'Hard',
  ): EvaluationData {
    if (difficulty !== 'Hard') return evaluation;

    const avgScore =
      (evaluation.technicalScore +
        evaluation.accuracyScore +
        evaluation.communicationScore +
        evaluation.confidenceScore) /
      4;

    if (avgScore >= 7) {
      const bonus = 0.5;
      return {
        ...evaluation,
        technicalScore: Math.min(10, evaluation.technicalScore + bonus),
        accuracyScore: Math.min(10, evaluation.accuracyScore + bonus),
      };
    }

    return evaluation;
  }

  // ───────────────────────────────────────────
  //  Candidate Behavior Moderator
  // ───────────────────────────────────────────

  async analyzeCandidate(candidateText: string): Promise<BehaviorAnalysis> {
    const prompt = `
You are a professional interview monitor. Analyze the candidate's message below.

Candidate message:
"${candidateText}"

Classify the behavior strictly using one of:
- "clean"      → professional, on-topic
- "mild"       → slightly unprofessional tone, off-topic rambling
- "abusive"    → abusive language, insults toward the interviewer
- "harassment" → sexual comments, flirting, or severe harassment

Rules:
- If "clean" or "mild" → isProfessional: true (mild is still allowed)
- If "abusive" or "harassment" → isProfessional: false

Penalties (deducted from final score later):
- mild       → 0
- abusive    → 25
- harassment → 40

Return ONLY valid JSON:
{
  "isProfessional": boolean,
  "severity": "clean" | "mild" | "abusive" | "harassment",
  "penalty": number,
  "closingMessage": string | null
}

If isProfessional is false, closingMessage must be:
"I'm going to end the interview here because the conversation is no longer professional. Thank you for your time."

If isProfessional is true, closingMessage must be null.
`;

    const fallback: BehaviorAnalysis = {
      isProfessional: true,
      severity: 'clean',
      penalty: 0,
      closingMessage: null,
    };

    return this.runWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      const parsed = this.cleanJson(result.response.text()) as BehaviorAnalysis;
      // Safety override: always enforce closingMessage logic
      if (!parsed.isProfessional && !parsed.closingMessage) {
        parsed.closingMessage =
          "I'm going to end the interview here because the conversation is no longer professional. Thank you for your time.";
      }
      return parsed;
    }, fallback, prompt);
  }

  // ───────────────────────────────────────────
  //  Question Generator  (main interview loop)
  // ───────────────────────────────────────────

  async generateQuestion(context: {
    jobDescription: any;
    resume: any;
    history: { role: string; content: string }[];
    evaluations?: EvaluationData[];
    penaltyPoints?: number;
  }): Promise<QuestionData & { reaction?: string }> {
    const evaluations = context.evaluations ?? [];
    const exchangeCount = Math.floor((context.history ?? []).length / 2);
    const difficulty = this.computeDifficulty(evaluations);
    const stageIndex = Math.min(exchangeCount, INTERVIEW_STAGES.length - 1);
    const currentStage: InterviewStage = INTERVIEW_STAGES[stageIndex];
    const isLastStage = stageIndex >= INTERVIEW_STAGES.length - 1;

    const prompt = `
You are a Senior Technical Recruiter conducting a LIVE interview. Speak naturally like a human — warm, confident, and professional.

NEVER use robotic phrases like "Next question:" or "Please answer the following:".
ALWAYS vary your sentence openers. Good examples:
- "That's a solid point. I'm curious — ..."
- "Interesting! Building on that, ..."
- "Good. Now let's shift gears a bit — ..."
- "I appreciate the detail. Here's a trickier one: ..."

Context:
- Job Description: ${JSON.stringify(context.jobDescription)}
- Candidate Resume: ${JSON.stringify(context.resume)}
- Interview History (previous Q&A): ${JSON.stringify(context.history ?? [])}
- Current Stage: "${currentStage}"
- Difficulty to use for this question: "${difficulty}"
- Number of exchanges so far: ${exchangeCount}
- Is this the final stage: ${isLastStage}

Instructions:
1. Ask exactly ONE question aligned with the current stage: "${currentStage}".
2. If history is non-empty, start with a brief natural reaction (1 sentence) to the last candidate answer before the question.
3. Keep the total response to 2-3 sentences maximum.
4. If isLastStage is true OR exchanges >= 8, set "isComplete": true and ask a graceful closing question or farewell.
5. Do NOT repeat questions already asked in history.
6. Difficulty must be exactly: "${difficulty}".

Return ONLY valid JSON:
{
  "question": "string (the full message including reaction + new question)",
  "skillFocus": "string",
  "difficulty": "${difficulty}",
  "isComplete": boolean
}
`;

    const historyLen = (context.history ?? []).length;
    const fallback = this.getFallbackQuestion(historyLen, difficulty);

    return this.runWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      return this.cleanJson(result.response.text()) as QuestionData;
    }, fallback, prompt);
  }

  // ───────────────────────────────────────────
  //  Answer Evaluator
  // ───────────────────────────────────────────

  async evaluateAnswer(
    question: string,
    answer: string,
    difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium',
  ): Promise<EvaluationData> {
    const prompt = `
You are a precise technical interviewer evaluating a candidate's answer.

Question: "${question}"
Candidate Answer: "${answer}"
Difficulty level: "${difficulty}"

Evaluate across four dimensions (score 0–10 each). Be strict but fair.
For a Hard question answered well, be generous. For a weak answer on any level, be honest.

Return ONLY valid JSON:
{
  "technicalScore": number,
  "accuracyScore": number,
  "communicationScore": number,
  "confidenceScore": number,
  "feedback": "string — 1-2 sentences of natural recruiter feedback",
  "improvementTip": "string — 1 actionable tip for the candidate"
}
`;

    const fallback: EvaluationData = {
      technicalScore: 0,
      accuracyScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      feedback: 'Answer recorded. AI evaluation encountered a temporary issue.',
      improvementTip: 'Please ensure your answers are detailed and structured.',
    };

    const raw = await this.runWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      return this.cleanJson(result.response.text()) as EvaluationData;
    }, fallback, prompt);

    // Apply hard-question bonus
    return this.applyHardQuestionBonus(raw, difficulty);
  }

  // ───────────────────────────────────────────
  //  Final Interview Report Generator
  // ───────────────────────────────────────────

  async generateInterviewReport(
    interviewData: {
      messages: { role: string; content: string }[];
      evaluations: EvaluationData[];
      penaltyPoints: number;
      jobDescription?: any;
      resume?: any;
    },
  ): Promise<InterviewReportData> {
    const { evaluations, penaltyPoints } = interviewData;

    // Pre-compute aggregated scores for the prompt
    const avgTech =
      evaluations.length > 0
        ? evaluations.reduce((s, e) => s + e.technicalScore, 0) /
        evaluations.length
        : 0;
    const avgAccuracy =
      evaluations.length > 0
        ? evaluations.reduce((s, e) => s + e.accuracyScore, 0) /
        evaluations.length
        : 0;
    const avgComm =
      evaluations.length > 0
        ? evaluations.reduce((s, e) => s + e.communicationScore, 0) /
        evaluations.length
        : 0;
    const avgConf =
      evaluations.length > 0
        ? evaluations.reduce((s, e) => s + e.confidenceScore, 0) /
        evaluations.length
        : 0;

    const prompt = `
You are a world-class Technical Recruiter writing an internal candidate evaluation report.

Interview Transcript:
${JSON.stringify(interviewData.messages)}

Per-answer Evaluation Scores (already computed):
- Average Technical Score: ${avgTech.toFixed(2)} / 10
- Average Accuracy Score: ${avgAccuracy.toFixed(2)} / 10
- Average Communication Score: ${avgComm.toFixed(2)} / 10
- Average Confidence Score: ${avgConf.toFixed(2)} / 10

Penalty Points (from misconduct): ${penaltyPoints}
- These penalty points MUST reduce the overall_rating proportionally.
- Every 10 penalty points reduce overall_rating by ~1 point.

Instructions:
- Evaluate the entire conversation holistically.
- Weigh technical performance, communication, problem-solving, and behavior.
- Apply penalties to overall_rating. Minimum overall_rating is 0.
- "recommendation" MUST be one of: "Hire", "Lean Hire", or "No Hire".
  - overall_rating >= 7 → "Hire"
  - overall_rating 4-6 → "Lean Hire"
  - overall_rating <= 3 OR significant misconduct → "No Hire"
- strengths[] and weaknesses[] should each have 3-5 bullet points.
- summary must be 3-4 sentences written like a recruiter's internal memo.

Return ONLY valid JSON:
{
  "overall_rating": number (0-10),
  "technical_score": number (0-10),
  "communication_score": number (0-10),
  "problem_solving_score": number (0-10),
  "behavioral_score": number (0-10),
  "culture_fit_score": number (0-10),
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendation": "Hire" | "Lean Hire" | "No Hire",
  "summary": "string"
}
`;

    const fallback: InterviewReportData = {
      overall_rating: 0,
      technical_score: 0,
      communication_score: 0,
      problem_solving_score: 0,
      behavioral_score: 0,
      culture_fit_score: 0,
      strengths: ['Interview record available for manual review'],
      weaknesses: [
        'AI evaluation service was temporarily unavailable',
        'Insufficient data for full scoring',
      ],
      recommendation: 'No Hire',
      summary:
        'The AI evaluation service encountered an error during report generation. Manual review of the interview transcript is strongly recommended. Scores default to zero due to the service failure.',
    };

    return this.runWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      return this.cleanJson(result.response.text()) as InterviewReportData;
    }, fallback, prompt);
  }

  // ───────────────────────────────────────────
  //  Legacy generateReport (backward-compat)
  // ───────────────────────────────────────────

  async generateReport(interviewData: {
    messages: { role: string; content: string }[];
    evaluations?: EvaluationData[];
    penaltyPoints?: number;
  }): Promise<any> {
    const report = await this.generateInterviewReport({
      messages: interviewData.messages,
      evaluations: interviewData.evaluations ?? [],
      penaltyPoints: interviewData.penaltyPoints ?? 0,
    });

    // Map to the legacy shape that the rest of the app expects
    const joiningProbability = Math.round(
      Math.min(100, Math.max(0, report.overall_rating * 9 + 10)),
    );
    return {
      overall_rating: report.overall_rating,
      technical_score: report.technical_score,
      communication_score: report.communication_score,
      problem_solving_score: report.problem_solving_score,
      behavioral_score: report.behavioral_score,
      culture_fit_score: report.culture_fit_score,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      detailed_feedback: report.summary,
      fit_for_role: report.recommendation === 'Hire' ? 'YES' : 'NO',
      joining_probability_percent: joiningProbability,
    };
  }

  // ───────────────────────────────────────────
  //  Simple Next-Question Helper (legacy)
  // ───────────────────────────────────────────

  async generateNextQuestion(
    history: { role: 'system' | 'user' | 'assistant'; content: string }[],
  ): Promise<string | null> {
    const prompt =
      history.map((h) => `${h.role.toUpperCase()}: ${h.content}`).join('\n\n') +
      '\n\nGenerate the next interview question based on the conversation above. Return only the question text, nothing else.';

    return this.runWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text ? text.replace(/^[\"']|[\"']$/g, '').trim() : null;
    }, null, prompt);
  }

  // ───────────────────────────────────────────
  //  Resume Evaluator
  // ───────────────────────────────────────────

  async evaluateResume(
    resumeText: string,
    jobDescription: string,
  ): Promise<any> {
    const prompt = `You are an expert technical recruiter.
Compare the following resume with the job description.
Score from 0 to 100 based on fit. Be objective but fair.
For students or early-career candidates, look for relevant coursework, projects, and potential.
Return JSON only:
{
  "skillMatchScore": number,
  "experienceMatch": number,
  "relevanceScore": number,
  "overallScore": number,
  "strengths": string[],
  "weaknesses": string[]
}

Job Description:
${jobDescription}

Resume:
${resumeText}`;

    const fallback = {
      skillMatchScore: 0,
      experienceMatch: 0,
      relevanceScore: 0,
      overallScore: 0,
      strengths: ['Unable to evaluate'],
      weaknesses: ['AI service unavailable'],
    };

    return this.runWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      return this.cleanJson(result.response.text());
    }, fallback, prompt);
  }

  // ───────────────────────────────────────────
  //  Question Refiner
  // ───────────────────────────────────────────

  async refineInterviewQuestions(
    questions: string[],
    resume: any,
    jobTitle: string,
  ): Promise<string[]> {
    const prompt = `
You are a Senior Technical Recruiter. Refine the following ${questions.length} interview questions for a ${jobTitle} position.

Candidate Summary: ${JSON.stringify(resume)}

Original Questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Rules:
1. Improve phrasing to be natural, professional, and diverse.
2. Increase technical depth based on candidate background.
3. Each must be a single, focused question.
4. VARY your openers: "Walk me through...", "How do you...", "Describe a time...", "In your experience...", etc.
5. Keep exactly ${questions.length} questions.
6. Return ONLY a JSON array of strings.

Format: ["Question 1", "Question 2", ...]
`;

    return this.runWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      const cleaned = this.cleanJson(result.response.text());
      if (Array.isArray(cleaned) && cleaned.length === questions.length) {
        return cleaned as string[];
      }
      return questions;
    }, questions, prompt);
  }

  // ───────────────────────────────────────────
  //  JSON Cleaner Utility
  // ───────────────────────────────────────────

  private cleanJson(text: string): any {
    try {
      const cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      // Try array first
      const arrStart = cleaned.indexOf('[');
      const arrEnd = cleaned.lastIndexOf(']');
      if (arrStart !== -1 && arrEnd !== -1 && arrStart < arrEnd) {
        return JSON.parse(cleaned.substring(arrStart, arrEnd + 1));
      }

      // Try object
      const objStart = cleaned.indexOf('{');
      const objEnd = cleaned.lastIndexOf('}');
      if (objStart !== -1 && objEnd !== -1 && objStart < objEnd) {
        return JSON.parse(cleaned.substring(objStart, objEnd + 1));
      }

      return JSON.parse(cleaned);
    } catch (e) {
      console.error('⚠️  Failed to parse Gemini JSON response:', text);
      throw new Error('Invalid JSON received from AI model.');
    }
  }

  // ───────────────────────────────────────────
  //  Fallback Question Bank
  // ───────────────────────────────────────────

  private getFallbackQuestion(
    historyLen: number,
    difficulty: 'Easy' | 'Medium' | 'Hard',
  ): QuestionData {
    const questions: QuestionData[] = [
      {
        question:
          "Welcome! I'm glad you're here today. To kick things off — could you give me a quick walk-through of your background and what brought you to apply for this role?",
        skillFocus: 'Communication',
        difficulty: 'Easy',
        isComplete: false,
      },
      {
        question:
          "Great, thank you for that overview. I noticed something interesting on your resume — could you tell me more about your most impactful project and the specific role you played in it?",
        skillFocus: 'Resume',
        difficulty: 'Medium',
        isComplete: false,
      },
      {
        question:
          "Solid background. Let's get into the technical side — how would you explain the difference between synchronous and asynchronous programming, and when would you choose one over the other?",
        skillFocus: 'Technical Fundamentals',
        difficulty: 'Medium',
        isComplete: false,
      },
      {
        question:
          "Good. Building on that — how do you manage race conditions or concurrency issues in a production system?",
        skillFocus: 'Technical Depth',
        difficulty: difficulty,
        isComplete: false,
      },
      {
        question:
          "Interesting approach. Now for something broader — imagine you're designing a real-time notification system for millions of users. How would you architect that?",
        skillFocus: 'System Design',
        difficulty: difficulty,
        isComplete: false,
      },
      {
        question:
          "Good thinking on the design. Here's a challenge — you're debugging a production issue with no logs and a 2-minute SLA. Walk me through exactly what you'd do.",
        skillFocus: 'Problem Solving',
        difficulty: difficulty,
        isComplete: false,
      },
      {
        question:
          "I appreciate the detail there. Let's shift gears — tell me about a time you had a significant disagreement with a teammate. How did you resolve it?",
        skillFocus: 'Behavioral',
        difficulty: 'Medium',
        isComplete: false,
      },
      {
        question:
          "That's great to hear. We're coming to the end of our session — do you have any questions for me about the team, the engineering culture, or the role itself?",
        skillFocus: 'Closing',
        difficulty: 'Easy',
        isComplete: true,
      },
    ];

    const index = Math.min(
      Math.floor(historyLen / 2),
      questions.length - 1,
    );
    return questions[index];
  }
}