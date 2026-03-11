import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { PatchProfileMeDto } from './dto/patch-profile-me.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @ApiOkResponse({ description: 'Current user profile' })
  @Get('me')
  async me(@Req() req: any) {
    return this.profiles.me(req.user.sub);
  }

  @ApiOkResponse({ description: 'Update current user profile' })
  @Patch('me')
  async patchMe(@Req() req: any, @Body() dto: PatchProfileMeDto) {
    return this.profiles.updateMe(req.user.sub, dto);
  }
}

