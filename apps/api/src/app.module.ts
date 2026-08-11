import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { SkillsModule } from './modules/skills/skills.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ModulesModule } from './modules/modules/modules.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { ProgressModule } from './modules/progress/progress.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';
import { EventsModule } from './modules/events/events.module';
import { LearningAccessModule } from './modules/learning-access/learning-access.module';
import { EmailVerifiedGuard } from './modules/auth/guards/email-verified.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    // Global rate limiting: 100 req / 60s default; auth endpoints override to stricter limits
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 100 },
    ]),
    // Enable @Cron() decorators across all modules
    ScheduleModule.forRoot(),
    PrismaModule,
    LearningAccessModule,
    HealthModule,
    EventsModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    SkillsModule,
    CoursesModule,
    ModulesModule,
    LessonsModule,
    EnrollmentsModule,
    GamificationModule,
    ProgressModule,
    QuizzesModule,
    AiModule,
    AdminModule,
  ],
  providers: [
    EmailVerifiedGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}