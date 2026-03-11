import { ApiProperty } from '@nestjs/swagger';
import { UserRoleType } from '../../../prisma-enums';

class MeProfileResponse {
  @ApiProperty()
  fullName!: string;

  @ApiProperty({ required: false, nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ type: [String] })
  interests!: string[];

  @ApiProperty()
  xp!: number;

  @ApiProperty()
  level!: number;
}

export class MeResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserRoleType, isArray: true })
  roles!: UserRoleType[];

  @ApiProperty({ required: false, type: MeProfileResponse, nullable: true })
  profile!: MeProfileResponse | null;
}

