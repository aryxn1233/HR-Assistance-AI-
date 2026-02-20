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
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            console.warn('GEMINI_API_KEY is not defined in environment variables');
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        }
    }

    async generateQuestion(context: any): Promise<QuestionData> {
        if (!this.model) {
            throw new Error('Gemini model not initialized. Check API Key.');
        }

        const prompt = `
            You are a professional technical interviewer. Generate ONE clear, concise interview question.
            Context:
            - Job Description: ${JSON.stringify(context.jobDescription)}
            - Candidate Resume: ${JSON.stringify(context.resume)}
            - Previous Question: ${context.previousQuestion || 'None'}
            - Previous Answer: ${context.previousAnswer || 'None'}
            - Stage: ${context.stage || 'General'}
            - Difficulty: ${context.difficulty || 'Medium'}

            Return ONLY valid JSON in this format:
            {
                "question": "string",
                "skillFocus": "string",
                "difficulty": "Easy | Medium | Hard"
            }
        `;

        const result = await this.model.generateContent(prompt);
        const response = result.response;
        return this.cleanJson(response.text()) as QuestionData;
    }

    async evaluateAnswer(question: string, answer: string): Promise<EvaluationData> {
        if (!this.model) {
            throw new Error('Gemini model not initialized');
        }

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

        const result = await this.model.generateContent(prompt);
        return this.cleanJson(result.response.text()) as EvaluationData;
    }

    async generateReport(interviewData: any): Promise<ReportData> {
        if (!this.model) {
            throw new Error('Gemini model not initialized');
        }

        const prompt = `
            Generate a final interview report based on the following session data:
            ${JSON.stringify(interviewData)}

            Return ONLY valid JSON:
            {
                "overallScore": number (0-100),
                "strengths": ["string"],
                "weaknesses": ["string"],
                "recommendation": "Strong Hire | Hire | No Hire",
                "detailedAnalysis": { ...key points... }
            }
        `;

        const result = await this.model.generateContent(prompt);
        return this.cleanJson(result.response.text()) as ReportData;
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
