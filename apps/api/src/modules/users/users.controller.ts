import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { MeResponse } from './dto/me.response';
import { PatchUserMeDto } from './dto/patch-user-me.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiOkResponse({ type: MeResponse })
  @Get('me')
  async me(@Req() req: any) {
    return this.users.me(req.user.sub);
  }

  @ApiOkResponse({ type: MeResponse })
  @Patch('me')
  async patchMe(@Req() req: any, @Body() dto: PatchUserMeDto) {
    return this.users.updateMe(req.user.sub, dto);
  }
}

