import fs from 'node:fs';
import path from 'node:path';

function resolveGeneratedPrismaClientPath() {
  let current = process.cwd();

  for (let index = 0; index < 5; index += 1) {
    const pnpmDir = path.join(current, 'node_modules', '.pnpm');
    if (fs.existsSync(pnpmDir)) {
      const prismaClientDir = fs
        .readdirSync(pnpmDir)
        .find((entry) => entry.startsWith('@prisma+client@'));

      if (!prismaClientDir) {
        throw new Error('Could not locate the generated Prisma client package in node_modules/.pnpm.');
      }

      const candidate = path.join(
        pnpmDir,
        prismaClientDir,
        'node_modules',
        '.prisma',
        'client',
      );

      if (!fs.existsSync(candidate)) {
        throw new Error(`Generated Prisma client not found at: ${candidate}`);
      }

      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  throw new Error('Could not find node_modules/.pnpm while resolving the generated Prisma client.');
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const generatedClient = require(resolveGeneratedPrismaClientPath()) as typeof import('@prisma/client');

export const PrismaClient = generatedClient.PrismaClient;
