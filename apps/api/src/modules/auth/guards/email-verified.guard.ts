import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req?.user?.sub as string | undefined;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Verify your email before accessing this area');
    }

    return true;
  }
}
