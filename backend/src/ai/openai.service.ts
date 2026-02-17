import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
    private openai: OpenAI;
    private readonly logger = new Logger(OpenAIService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('OPENAI_API_KEY not found in environment variables');
        }
        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key', // Fallback for dev/test if key missing
        });
    }

    async generateResponse(systemPrompt: string, userPrompt: string): Promise<string> {
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                model: 'gpt-4-turbo-preview', // Or gpt-3.5-turbo
            });
            return completion.choices[0].message.content || '';
        } catch (error) {
            this.logger.error('Error generating AI response:', error);
            // Fallback or rethrow
            return 'AI Service Unavailable';
        }
    }

    async parseResume(resumeText: string): Promise<any> {
        const systemPrompt = `You are an expert HR assistant. Extract the following details from the resume text in JSON format:
    - skills (array of strings)
    - experienceYears (number)
    - keyProjects (array of strings)
    - education (array of strings)
    If a field is not found, return null or empty array. Output ONLY valid JSON.`;

        const response = await this.generateResponse(systemPrompt, resumeText);
        try {
            // Simple cleanup for potential markdown formatting in response
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            this.logger.error('Failed to parse AI response as JSON', e);
            return { error: 'Failed to parse resume' };
        }
    }

    async generateInterviewQuestion(jobDescription: string, contextOrTopic: string): Promise<string> {
        let systemPrompt = `You are an expert technical interviewer.`;
        let userPrompt = `Job Description: ${jobDescription}\n`;

        if (contextOrTopic.trim().startsWith('[')) {
            // It's history
            systemPrompt += ` Generate the next question based on the interview history. Maintain flow.`;
            userPrompt += `History: ${contextOrTopic}\n\nNext Question:`;
        } else {
            // It's a topic
            systemPrompt += ` Generate a challenging question on the topic.`;
            userPrompt += `Topic: ${contextOrTopic}\n\nQuestion:`;
        }

        return this.generateResponse(systemPrompt, userPrompt);
    }

    async evaluateAnswer(question: string, answer: string): Promise<{ score: number; feedback: string }> {
        const systemPrompt = `You are an expert technical interviewer. Evaluate the candidate's answer to the question.
     Return the result in JSON format with:
     - score (number 0-10)
     - feedback (string, constructive feedback)
     Output ONLY valid JSON.`;

        const userPrompt = `Question: ${question}\nAnswer: ${answer}`;
        const response = await this.generateResponse(systemPrompt, userPrompt);
        try {
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            return { score: 0, feedback: 'Error evaluating answer' };
        }
    }
}
