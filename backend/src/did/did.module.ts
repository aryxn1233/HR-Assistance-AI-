import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DIdService } from './did.service';
import { DIdController } from './did.controller';
import { DIdSessionManager } from './did-session.manager';
import { Application } from '../candidates/application.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Application])],
  providers: [DIdService, DIdSessionManager],
  controllers: [DIdController],
  exports: [DIdService, DIdSessionManager],
})
export class DIdModule {}
