import { SetMetadata } from '@nestjs/common';
import { UserRoleType } from '../../../prisma-enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoleType[]) => SetMetadata(ROLES_KEY, roles);

