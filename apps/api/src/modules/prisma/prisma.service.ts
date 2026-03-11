import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL;
    console.log('[prisma] DATABASE_URL exists=', !!dbUrl);
    console.log('[prisma] DATABASE_URL host=', sanitizeDatabaseHost(dbUrl));
    try {
      await this.$connect();
    } catch (err) {
      console.error('[prisma] $connect failed:', err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}

