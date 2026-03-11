import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';

function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  // When deployed behind a proxy (Render/Railway/etc), enable secure cookies / correct client IPs.
  if (String(config.get('TRUST_PROXY') ?? '').toLowerCase() === 'true' || String(config.get('TRUST_PROXY') ?? '') === '1') {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    }),
  );

  app.use(cookieParser());

  const allowedOrigins = [
    ...parseAllowedOrigins(config.get<string>('WEB_ORIGINS')),
    ...(config.get<string>('WEB_ORIGIN') ? [config.get<string>('WEB_ORIGIN')!] : []),
  ];
  const defaultOrigin = config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3100';
  const origins = allowedOrigins.length > 0 ? allowedOrigins : [defaultOrigin];

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (origins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SkillForge API')
    .setDescription('Backend API for SkillForge')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT || config.get('API_PORT') || 3200);
  await app.listen(port);
}

void bootstrap();

