import { Module } from '@nestjs/common';
import { HeyGenService } from './heygen.service';
import { HeyGenController } from './heygen.controller';

@Module({
    providers: [HeyGenService],
    controllers: [HeyGenController],
    exports: [HeyGenService],
})
export class HeyGenModule { }
