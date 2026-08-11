import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(currentDir, '../../.env');

loadEnv({ path: rootEnvPath });

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'ts-node -T prisma/seed.ts',
  },
});
