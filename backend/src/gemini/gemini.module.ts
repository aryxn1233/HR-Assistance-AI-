import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [ConfigModule, AIModule],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule { }
