import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // ── Global Validation ───────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strip unknown fields
      forbidNonWhitelisted: false, // don't throw on extra fields – be lenient for legacy payloads
      transform: true,            // auto-transform primitives to their declared types
    }),
  );

  // ── CORS ──────────────────────────────────────────────
  const allowedOrigins = [
    'https://hr-assistance-ai.vercel.app',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Static Assets ─────────────────────────────────────
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  const port = process.env.PORT || 3003;
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 HireMe API running on: ${await app.getUrl()}`);
  logger.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
