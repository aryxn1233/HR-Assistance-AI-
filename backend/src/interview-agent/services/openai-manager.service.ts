import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiManagerService {
  private readonly logger = new Logger(OpenAiManagerService.name);
  private keys: string[] = [];
  private currentKeyIndex = 0;
  private openAiInstances: OpenAI[] = [];
  public isFallbackMode = false;

  constructor(private configService: ConfigService) {
    this.initializeKeys();
  }

  private initializeKeys() {
    const key1 = this.configService.get<string>('OPENAI_KEY_1');
    const key2 = this.configService.get<string>('OPENAI_KEY_2');
    const key3 = this.configService.get<string>('OPENAI_KEY_3');

    if (key1) this.keys.push(key1);
    if (key2) this.keys.push(key2);
    if (key3) this.keys.push(key3);

    if (this.keys.length === 0) {
      this.logger.warn(
        'No OPENAI API keys found! System will start in fallback mode.',
      );
      this.isFallbackMode = true;
    } else {
      this.keys.forEach((key) => {
        this.openAiInstances.push(new OpenAI({ apiKey: key }));
      });
    }
  }

  private get currentOpenAi(): OpenAI | null {
    if (this.isFallbackMode || this.openAiInstances.length === 0) {
      return null;
    }
    return this.openAiInstances[this.currentKeyIndex];
  }

  private rotateKey() {
    if (this.currentKeyIndex < this.keys.length - 1) {
      this.currentKeyIndex++;
      this.logger.log(`Switched to OpenAI API Key ${this.currentKeyIndex + 1}`);
    } else {
      this.logger.error(
        'All OpenAI API keys have been exhausted! Switching to AI_FALLBACK_MODE.',
      );
      this.isFallbackMode = true;
    }
  }

  async generateNextQuestion(
    history: { role: 'system' | 'user' | 'assistant'; content: string }[],
    retries = 0,
  ): Promise<string | null> {
    if (this.isFallbackMode) {
      return null; // Signals agent service to use fallback DB questions
    }

    const openAi = this.currentOpenAi;
    if (!openAi) return null;

    try {
      const response = await openAi.chat.completions.create({
        model: 'gpt-4-turbo-preview', // Or whatever production model
        messages: history,
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.choices[0].message.content?.trim() || null;
    } catch (error: any) {
      this.logger.error(`OpenAI Error: ${error.message}`);

      // Handle rate limits or quota errors
      if (
        error?.status === 429 ||
        error?.code === 'insufficient_quota' ||
        error?.message?.includes('rate_limit_error') ||
        error?.message?.includes('quota_exceeded')
      ) {
        this.rotateKey();
        // Avoid infinite recursion, bound retries by key count
        if (retries < this.keys.length && !this.isFallbackMode) {
          return this.generateNextQuestion(history, retries + 1);
        }
      }

      // Other errors, or out of keys
      return null;
    }
  }

  async evaluateAnswer(question: string, answer: string): Promise<any | null> {
    if (this.isFallbackMode) return null;

    const openAi = this.currentOpenAi;
    if (!openAi) return null;

    try {
      const response = await openAi.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI technical interviewer evaluating a candidate answer. Return a JSON with { "technicalScore": 1-10, "accuracyScore": 1-10, "communicationScore": 1-10, "confidenceScore": 1-10, "feedback": "Brief feedback" }',
          },
          { role: 'user', content: `Question: ${question}\nAnswer: ${answer}` },
        ],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error: any) {
      this.logger.error(`OpenAI Evaluation Error: ${error.message}`);
      if (error?.status === 429 || error?.code === 'insufficient_quota') {
        this.rotateKey();
        if (!this.isFallbackMode) {
          return this.evaluateAnswer(question, answer); // basic retry
        }
      }
      return null;
    }
  }
}
