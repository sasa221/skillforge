import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '../../prisma-enums';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SiteSurfacesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublished(slug: string) {
    const surface = await this.prisma.siteSurface.findFirst({
      where: { slug, status: ContentStatus.published },
    });
    if (!surface) throw new NotFoundException('Page content not found');
    return surface;
  }
}
