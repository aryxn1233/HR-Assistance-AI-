import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;
  private clients: OpenAI[] = [];
  private readonly logger = new Logger(OpenAIService.name);

  constructor(private configService: ConfigService) {
    // Load all available OpenAI keys
    const keys = [
      this.configService.get<string>('OPENAI_API_KEY'),
      this.configService.get<string>('OPENAI_API_KEY2'),
      this.configService.get<string>('OPENAI_API_KEY3'),
      this.configService.get<string>('OPENAI_API_KEY4'),
      this.configService.get<string>('OPENAI_API_KEY5'),
    ].filter((k) => !!k) as string[];

    if (keys.length === 0) {
      this.logger.warn('No OPENAI_API_KEYs found in environment variables');
      this.apiKeys = ['dummy-key'];
    } else {
      this.apiKeys = keys;
      this.logger.log(
        `Initialized with ${this.apiKeys.length} OpenAI API keys.`,
      );
    }

    this.clients = this.apiKeys.map((key) => new OpenAI({ apiKey: key }));
  }

  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    let attempts = 0;
    const maxAttempts = this.apiKeys.length;

    while (attempts < maxAttempts) {
      const client = this.clients[this.currentKeyIndex];
      try {
        const completion = await client.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: 'gpt-4o-mini',
        });
        const content =
          completion.choices[0].message.content || 'AI Service Unavailable';
        this.logger.debug(`AI Response: ${content}`);
        return content;
      } catch (error: any) {
        attempts++;
        this.logger.error(
          `Error with OpenAI Key #${this.currentKeyIndex + 1}: ${error.message}`,
        );

        // If rate limit (429), server error (5xx), OR auth error (401/403), switch key and retry
        if (
          error.status === 429 ||
          error.status >= 500 ||
          error.status === 401 ||
          error.status === 403
        ) {
          this.currentKeyIndex =
            (this.currentKeyIndex + 1) % this.apiKeys.length;
          this.logger.warn(
            `Switching to OpenAI API Key #${this.currentKeyIndex + 1} (Attempt ${attempts + 1}/${maxAttempts}) due to ${error.status}`,
          );
          continue;
        }

        // For other errors, rethrow to be caught by specific handlers
        throw error;
      }
    }

    throw new Error(
      'AI Service Unavailable after multiple retries across all keys',
    );
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
      const cleanJson = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      this.logger.error('Failed to parse AI response as JSON', e);
      return { error: 'Failed to parse resume' };
    }
  }

  async evaluateResume(
    resumeText: string,
    jobDescription: string,
  ): Promise<any> {
    const systemPrompt = `You are an expert technical recruiter.
Compare the following resume with the job description.
Score from 0 to 100 based on fit.
Be objective but fair. For students or early-career candidates, look for relevant coursework, projects, and potential.
If the resume is extremely brief (e.g., only a name), provide low but realistic scores if any keywords match.
Return JSON only in this format:
{
  "skillMatchScore": number,
  "experienceMatch": number,
  "relevanceScore": number,
  "overallScore": number,
  "strengths": string[],
  "weaknesses": string[]
}`;

    const userPrompt = `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}`;
    const response = await this.generateResponse(systemPrompt, userPrompt);
    try {
      const cleanJson = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      this.logger.error('Failed to parse resume evaluation response', e);
      throw new Error('Failed to parse AI response for resume evaluation');
    }
  }

  async generateInterviewQuestion(
    jobDescription: string,
    contextOrTopic: string,
  ): Promise<string> {
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

  async evaluateAnswer(
    question: string,
    answer: string,
  ): Promise<{ score: number; feedback: string }> {
    const systemPrompt = `You are an expert technical interviewer. Evaluate the candidate's answer to the question.
     Return the result in JSON format with:
     - score (number 0-10)
     - feedback (string, constructive feedback)
     Output ONLY valid JSON.`;

    const userPrompt = `Question: ${question}\nAnswer: ${answer}`;
    const response = await this.generateResponse(systemPrompt, userPrompt);
    try {
      const cleanJson = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      return { score: 0, feedback: 'Error evaluating answer' };
    }
  }

  async generateInterviewReport(interviewData: any): Promise<any> {
    const systemPrompt = `You are an expert technical recruiter. Analyze the interview transcript and provide a detailed report.
    Return ONLY valid JSON with no extra text.
    Format your response exactly as follows:
    {
      "overall_rating": 0-10,
      "technical_score": 0-10,
      "communication_score": 0-10,
      "problem_solving_score": 0-10,
      "behavioral_score": 0-10,
      "culture_fit_score": 0-10,
      "strengths": ["string"],
      "weaknesses": ["string"],
      "detailed_feedback": "Score: [0-100]\\nFeedback: [summary]\\nStrengths: [bullets]\\nAreas for Improvement: [bullets]",
      "fit_for_role": "YES" | "NO",
      "joining_probability_percent": 0-100
    }`;

    const userPrompt = `Job Title: ${interviewData.job}\nTranscript:\n${JSON.stringify(interviewData.messages)}`;
    const response = await this.generateResponse(systemPrompt, userPrompt);
    try {
      const cleanJson = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      this.logger.error('Failed to parse interview report response', e);
      return {
        overall_rating: 0,
        technical_score: 0,
        communication_score: 0,
        problem_solving_score: 0,
        behavioral_score: 0,
        culture_fit_score: 0,
        strengths: ['Interview record available'],
        weaknesses: [
          'Interview too short or AI evaluation service unavailable',
        ],
        detailed_feedback:
          'Score: 0\\nFeedback: The interview was either too short to evaluate or the AI service encountered an error. Manual review of the transcript is recommended.',
        fit_for_role: 'NO',
        joining_probability_percent: 0,
      };
    }
  }
}
