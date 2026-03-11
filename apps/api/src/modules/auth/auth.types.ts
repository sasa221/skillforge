import { UserRoleType } from '@prisma/client';

export type JwtUser = {
  sub: string;
  email: string;
  roles: UserRoleType[];
};

