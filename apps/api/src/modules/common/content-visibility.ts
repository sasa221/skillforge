import { ContentStatus } from '@prisma/client';

export const PUBLIC_CONTENT_WHERE = {
  status: ContentStatus.published,
  deletedAt: null as any,
};

