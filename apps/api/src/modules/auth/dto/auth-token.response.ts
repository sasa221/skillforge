import { ApiProperty } from '@nestjs/swagger';

import { MeResponse } from '../../users/dto/me.response';

export class AuthTokenResponse {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: MeResponse })
  user!: MeResponse;
}

