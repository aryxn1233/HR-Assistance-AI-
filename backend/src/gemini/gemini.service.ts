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
        ].filter(k => !!k) as string[];

        if (keys.length === 0) {
            console.warn('No GEMINI_API_KEYs found in environment variables');
        } else {
            this.models = keys.map(key => {
                const genAI = new GoogleGenerativeAI(key);
                return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            });
            console.log(`Initialized GeminiService with ${this.models.length} API keys.`);
        }
    }

    private async runWithRotation<T>(action: (model: GenerativeModel) => Promise<T>, fallback: T): Promise<T> {
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
                console.error(`Error with Gemini Key #${this.currentKeyIndex + 1}: ${error.message}`);

                // Check for rate limit (429) or other retryable errors
                const isRetryable = error.message?.includes('429') || error.status === 429 || error.status >= 500;

                if (isRetryable && attempts < maxAttempts) {
                    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.models.length;
                    console.warn(`Switching to Gemini API Key #${this.currentKeyIndex + 1} (Attempt ${attempts + 1}/${maxAttempts})`);
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
        { question: "Tell me about yourself and your professional background.", skillFocus: "Communication", difficulty: "Easy", isComplete: false },
        { question: "What is your greatest professional achievement and what was your specific role in it?", skillFocus: "Behavioral", difficulty: "Medium", isComplete: false },
        { question: "Describe a situation where you had to solve a complex technical problem. How did you approach it?", skillFocus: "Problem Solving", difficulty: "Medium", isComplete: false },
        { question: "How do you handle disagreements with team members or managers?", skillFocus: "Behavioral", difficulty: "Medium", isComplete: false },
        { question: "What key technologies or tools are you most proficient with, and how have you used them in recent projects?", skillFocus: "Technical", difficulty: "Medium", isComplete: false },
        { question: "Where do you see yourself professionally in the next 3–5 years?", skillFocus: "Career Goals", difficulty: "Easy", isComplete: false },
        { question: "Describe a project where you had to learn a new skill quickly. How did you manage it?", skillFocus: "Adaptability", difficulty: "Medium", isComplete: false },
        { question: "How do you prioritize tasks when managing multiple projects simultaneously?", skillFocus: "Time Management", difficulty: "Medium", isComplete: false },
        { question: "This role may require relocation to Bangalore. Are you open to that?", skillFocus: "Logistics", difficulty: "Easy", isComplete: false },
        { question: "What are your salary expectations, and how flexible are you?", skillFocus: "Negotiation", difficulty: "Easy", isComplete: false },
        { question: "Do you have any questions for us about the role or the company?", skillFocus: "Engagement", difficulty: "Easy", isComplete: false },
    ];

    async generateQuestion(context: any): Promise<QuestionData> {
        const prompt = `
            You are a professional technical recruiter conducting a structured, adaptive interview.

            Rules:
            - Ask one question at a time.
            - Wait for candidate answer before next question.
            - **Adaptive Probing**: Pay close attention to the candidate's previous answer. 
                - If they mention proficiency in a specific language (e.g., Java, Python), ask a technical follow-up to test that depth.
                - If they mention a specific project (e.g., Blockchain app, SaaS platform), ask about their specific role, the architecture, or a challenge they faced.
                - Do NOT stick to a generic script if the candidate provides interesting technical hooks.
            - Include:
                - Technical questions based on resume AND conversation flow.
                - Behavioral questions.
                - Ethical alignment.
                - Relocation (Bangalore).
            - Maintain professional tone.
            - End interview after sufficient evaluation (~8-12 questions).
            - When interview is complete, say: "INTERVIEW_COMPLETE"

            Context:
            - Job Description: ${JSON.stringify(context.jobDescription)}
            - Candidate Resume: ${JSON.stringify(context.resume)}
            - Previous Questions/Answers: ${JSON.stringify(context.history || [])}
            - Difficulty: ${context.difficulty || 'Medium'}

            Return ONLY valid JSON in this format:
            {
                "question": "string",
                "skillFocus": "string",
                "difficulty": "Easy | Medium | Hard",
                "isComplete": boolean (set true ONLY if you said INTERVIEW_COMPLETE)
            }
        `;

        const historyLen = (context.history || []).length;
        const fallback = (historyLen < this.fallbackQuestions.length)
            ? this.fallbackQuestions[historyLen]
            : { question: '', skillFocus: 'Wrap-up', difficulty: 'Easy', isComplete: true } as any;

        return this.runWithRotation(async (model) => {
            const result = await model.generateContent(prompt);
            return this.cleanJson(result.response.text()) as QuestionData;
        }, fallback);
    }

    async evaluateAnswer(question: string, answer: string): Promise<EvaluationData> {
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
            technicalScore: 7,
            accuracyScore: 7,
            communicationScore: 7,
            confidenceScore: 7,
            feedback: 'Answer recorded. AI evaluation temporarily unavailable.'
        };

        return this.runWithRotation(async (model) => {
            const result = await model.generateContent(prompt);
            return this.cleanJson(result.response.text()) as EvaluationData;
        }, fallback);
    }

    async generateReport(interviewData: any): Promise<any> {
        const prompt = `
            Based on the following interview transcript, generate a structured evaluation report.
            Transcript: ${JSON.stringify(interviewData.messages)}

            Evaluation must consider:
            - Relocation willingness (Bangalore question)
            - Ethical alignment
            - Clarity in career goals
            - Salary expectation flexibility
            - Long-term commitment signals

            Return ONLY valid JSON format:
            {
              "technical_score": 0-10,
              "communication_score": 0-10,
              "problem_solving_score": 0-10,
              "behavioral_score": 0-10,
              "culture_fit_score": 0-10,
              "overall_rating": 0-10,
              "strengths": [],
              "weaknesses": [],
              "detailed_feedback": "",
              "fit_for_role": "YES" | "NO",
              "confidence_level": "Low" | "Medium" | "High",
              "joining_probability_percent": 0-100,
              "joining_reasoning": ""
            }
        `;

        const fallback = {
            technical_score: 7,
            communication_score: 7,
            problem_solving_score: 7,
            behavioral_score: 7,
            culture_fit_score: 7,
            overall_rating: 7,
            strengths: ['Candidate completed the interview'],
            weaknesses: ['AI evaluation temporarily unavailable'],
            detailed_feedback: 'Interview completed. AI-generated evaluation is temporarily unavailable due to API rate limits.',
            fit_for_role: 'YES',
            confidence_level: 'Medium',
            joining_probability_percent: 70,
            joining_reasoning: 'Evaluation pending full AI analysis.'
        };

        return this.runWithRotation(async (model) => {
            const result = await model.generateContent(prompt);
            return this.cleanJson(result.response.text());
        }, fallback);
    }


    private cleanJson(text: string): any {
        try {
            // Remove markdown code blocks if present
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e) {
            console.error('Failed to parse Gemini JSON response:', text);
            throw new Error('Invalid JSON from AI');
        }
    }
}
