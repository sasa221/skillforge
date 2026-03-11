import { UserRoleType } from '../../prisma-enums';

export type JwtUser = {
  sub: string;
  email: string;
  roles: UserRoleType[];
};

