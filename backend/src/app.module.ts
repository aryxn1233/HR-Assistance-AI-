/* eslint-disable @typescript-eslint/no-unused-vars */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { JobsModule } from './jobs/jobs.module';
import { CandidatesModule } from './candidates/candidates.module';
import { InterviewsModule } from './interviews/interviews.module';
import { AIModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { GeminiModule } from './gemini/gemini.module';
import { DIdModule } from './did/did.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { InterviewAgentModule } from './interview-agent/interview-agent.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // ... rest same
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        ssl:
          configService.get<string>('DB_HOST')?.includes('render.com') ||
            configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    JobsModule,
    CandidatesModule,
    InterviewsModule,
    AnalyticsModule,
    GeminiModule,
    DIdModule,
    WebhooksModule,
    InterviewAgentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
