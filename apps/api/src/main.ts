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

/** Extract host only from DATABASE_URL for safe logging. Never log full URL. */
function sanitizeDatabaseHost(url: string | undefined): string {
  if (!url) return '[not set]';
  try {
    const u = new URL(url.replace(/^postgres:\/\//, 'postgresql://'));
    return `${u.hostname}:${u.port || '5432'}`;
  } catch {
    return '[invalid url]';
  }
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
  const trustProxy = (String(config.get('TRUST_PROXY') ?? '').toLowerCase() === 'true') || (String(config.get('TRUST_PROXY') ?? '') === '1');

  // Safe startup diagnostics (no secrets)
  const dbUrl = process.env.DATABASE_URL;
  console.log('[startup] NODE_ENV=', process.env.NODE_ENV);
  console.log('[startup] process.env.PORT=', process.env.PORT);
  console.log('[startup] resolved port=', port);
  console.log('[startup] DATABASE_URL exists=', !!dbUrl);
  console.log('[startup] DATABASE_URL host=', sanitizeDatabaseHost(dbUrl));
  console.log('[startup] WEB_ORIGIN=', config.get<string>('WEB_ORIGIN') ?? '[not set]');
  console.log('[startup] WEB_ORIGINS=', config.get<string>('WEB_ORIGINS') ?? '[not set]');
  console.log('[startup] TRUST_PROXY enabled=', trustProxy);

  await app.listen(port, '0.0.0.0');
}

void bootstrap();

