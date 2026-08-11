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

class MeInstructorProfileResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ required: false, nullable: true })
  title!: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty({ required: false, nullable: true })
  avatarUrl!: string | null;
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

  @ApiProperty({ required: false, type: MeInstructorProfileResponse, nullable: true })
  instructorProfile!: MeInstructorProfileResponse | null;
}

