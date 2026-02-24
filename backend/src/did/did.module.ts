import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DIdService } from './did.service';
import { DIdController } from './did.controller';
import { Application } from '../candidates/application.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Application])],
    providers: [DIdService],
    controllers: [DIdController],
    exports: [DIdService],
})
export class DIdModule { }
