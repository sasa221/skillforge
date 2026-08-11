import { GamificationService } from './gamification.service';

describe('GamificationService streaks', () => {
  function createService(profile: { streakDays: number; streakUpdatedAt: Date | null }) {
    const prisma = {
      userProfile: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(profile),
        update: jest.fn().mockImplementation(async ({ data }: any) => ({
          streakDays: data.streakDays ?? profile.streakDays,
          streakUpdatedAt: data.streakUpdatedAt ?? profile.streakUpdatedAt,
        })),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };

    return {
      prisma,
      service: new GamificationService(prisma as any),
    };
  }

  it('starts a new streak at 1 when the learner studies today after a gap', async () => {
    const { service, prisma } = createService({
      streakDays: 4,
      streakUpdatedAt: new Date('2026-03-24T00:00:00.000Z'),
    });

    const result = await service.markDailyLearningActivity('user-1', new Date('2026-03-27T12:30:00.000Z'));

    expect(prisma.userProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          streakDays: 1,
          streakUpdatedAt: new Date('2026-03-27T00:00:00.000Z'),
        }),
      }),
    );
    expect(result.streakDays).toBe(1);
    expect(result.updated).toBe(true);
  });

  it('increments the streak when the learner studies on consecutive UTC days', async () => {
    const { service, prisma } = createService({
      streakDays: 4,
      streakUpdatedAt: new Date('2026-03-26T00:00:00.000Z'),
    });

    const result = await service.markDailyLearningActivity('user-1', new Date('2026-03-27T08:00:00.000Z'));

    expect(prisma.userProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          streakDays: 5,
          streakUpdatedAt: new Date('2026-03-27T00:00:00.000Z'),
        }),
      }),
    );
    expect(result.streakDays).toBe(5);
  });

  it('does not increment twice on the same UTC day', async () => {
    const today = new Date('2026-03-27T00:00:00.000Z');
    const { service, prisma } = createService({
      streakDays: 3,
      streakUpdatedAt: today,
    });

    const result = await service.markDailyLearningActivity('user-1', new Date('2026-03-27T21:15:00.000Z'));

    expect(prisma.userProfile.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      streakDays: 3,
      streakUpdatedAt: today,
      updated: false,
    });
  });

  it('resets stale streaks that missed yesterday', async () => {
    const { service, prisma } = createService({
      streakDays: 3,
      streakUpdatedAt: new Date('2026-03-24T00:00:00.000Z'),
    });

    const count = await service.resetBrokenStreaks(new Date('2026-03-27T06:00:00.000Z'));

    expect(prisma.userProfile.updateMany).toHaveBeenCalledWith({
      where: {
        streakDays: { gt: 0 },
        OR: [{ streakUpdatedAt: null }, { streakUpdatedAt: { lt: new Date('2026-03-26T00:00:00.000Z') } }],
      },
      data: {
        streakDays: 0,
      },
    });
    expect(count).toBe(2);
  });
});
