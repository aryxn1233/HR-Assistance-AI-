import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { InterviewGateway } from './interview.gateway';
import { Interview } from './interview.entity';
import { AIModule } from '../ai/ai.module';

@Module({
    imports: [TypeOrmModule.forFeature([Interview]), AIModule],
    controllers: [InterviewsController],
    providers: [InterviewsService, InterviewGateway],
    exports: [InterviewsService],
})
export class InterviewsModule { }
