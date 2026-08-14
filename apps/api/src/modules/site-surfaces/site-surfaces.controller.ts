import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { SiteSurfacesService } from './site-surfaces.service';

@ApiTags('site-surfaces')
@Controller('site-surfaces')
export class SiteSurfacesController {
  constructor(private readonly siteSurfaces: SiteSurfacesService) {}

  @ApiOkResponse({ description: 'Get a published public site surface' })
  @Get(':slug')
  getPublished(@Param('slug') slug: string) {
    return this.siteSurfaces.getPublished(slug);
  }
}
