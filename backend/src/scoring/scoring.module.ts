import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { AIModule } from '../ai/ai.module';

@Module({
    imports: [AIModule],
    providers: [ScoringService],
    exports: [ScoringService],
})
export class ScoringModule { }
