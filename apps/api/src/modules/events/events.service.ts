import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type EventName =
  | 'user_signup'
  | 'user_login'
  | 'course_enrolled'
  | 'lesson_opened'
  | 'lesson_completed'
  | 'quiz_submitted'
  | 'quiz_passed'
  | 'ai_message_sent'
  | 'course_completed';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(userId: string | null, action: EventName, metadata?: Record<string, any>) {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId ?? null,
        action,
        entityType: metadata?.entityType ?? null,
        entityId: metadata?.entityId ?? null,
        metadata: metadata ?? undefined,
      },
    });
  }
}

