import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [GeminiModule],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
