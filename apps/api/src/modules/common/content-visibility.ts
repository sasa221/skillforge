import { ContentStatus } from '../../prisma-enums';

export const PUBLIC_CONTENT_WHERE = {
  status: ContentStatus.published,
  deletedAt: null as any,
};

