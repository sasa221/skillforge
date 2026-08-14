import { Module } from '@nestjs/common';

import { SiteSurfacesController } from './site-surfaces.controller';
import { SiteSurfacesService } from './site-surfaces.service';

@Module({
  controllers: [SiteSurfacesController],
  providers: [SiteSurfacesService],
})
export class SiteSurfacesModule {}
