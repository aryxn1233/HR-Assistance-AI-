import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { Job } from './job.entity';
import { Application } from '../candidates/application.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Job, Application])],
    controllers: [JobsController],
    providers: [JobsService],
    exports: [JobsService, TypeOrmModule],
})
export class JobsModule { }
