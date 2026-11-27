import { expect, test, vi } from 'vitest';
import { z } from 'zod';
import {
  createTestVillage,
  prepareTestDatabase,
  setTestBuildingLevel,
  setTestDeveloperSetting,
} from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateCulturePointsCelebrationDuration } from '@pillage-first/game-assets/utils/culture-points';
import { serverMock } from '@pillage-first/mocks/server';
import { createControllerArgs } from '../../http/controllers/__tests__/utils/controller-args';
import {
  getVillageCelebration,
  startVillageCelebration,
} from '../../http/controllers/celebration-controllers';
import { updateDeveloperSettings } from '../../http/controllers/developer-tools-controllers';

test('celebrations complete global milestones on start and preserve completion timestamps', async () => {
  using database = await prepareTestDatabase();

  const villageId = database.selectValue({
    sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1',
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  })!;

  setTestBuildingLevel(database, villageId, 'TOWN_HALL', 10);
  setTestDeveloperSetting(database, 'is_free_celebrations_enabled', 1);
  setTestDeveloperSetting(database, 'is_instant_celebrations_enabled', 1);

  const questIds = database.selectValues({
    sql: "SELECT quest_id FROM quests WHERE quest_id GLOB 'celebrationCount-*' ORDER BY quest_id;",
    schema: z.string(),
  });

  expect(questIds.length).toBeGreaterThan(0);

  using clock = vi.spyOn(Date, 'now');

  for (let count = 1; count <= 100; count += 1) {
    clock.mockReturnValue(count);
    startVillageCelebration(
      database,
      createControllerArgs<'/villages/:villageId/celebration', 'post'>({
        path: { villageId },
        body: { celebrationType: count % 2 ? 'small' : 'large' },
      }),
    );

    const completed = database.selectObjects({
      sql: `
        SELECT quest_id, completed_at
        FROM quests
        WHERE quest_id GLOB 'celebrationCount-*'
        ORDER BY quest_id;
      `,
      schema: z.strictObject({
        quest_id: z.string(),
        completed_at: z.number().nullable(),
      }),
    });

    const expected = questIds.map((questId) => {
      const milestone = Number(questId.split('-')[1]);

      return {
        quest_id: questId,
        completed_at: milestone <= count ? milestone : null,
      };
    });

    expect(completed).toStrictEqual(expected);
  }
});

test.each(['small', 'large'] as const)(
  '%s celebration charges resources independently of the cooldown and expires at its deadline',
  async (celebrationType) => {
    using database = await prepareTestDatabase();

    const now = Date.now();
    using clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    const { id: villageId } = createTestVillage(
      database,
      'Celebration village',
      {
        resourceSite: { updatedAt: now },
      },
    );
    const townHallLevel = 10;
    setTestBuildingLevel(database, villageId, 'TOWN_HALL', townHallLevel);

    const path = { villageId };
    const get = () =>
      getVillageCelebration(
        database,
        createControllerArgs<'/villages/:villageId/celebration'>({ path }),
      );
    const start = () =>
      startVillageCelebration(
        database,
        createControllerArgs<'/villages/:villageId/celebration', 'post'>({
          path,
          body: { celebrationType },
        }),
      );

    setTestDeveloperSetting(database, 'is_instant_celebrations_enabled', 1);

    expect(start).toThrow('Not enough resources');
    expect(get()).toBeNull();

    setTestDeveloperSetting(database, 'is_instant_celebrations_enabled', 0);
    setTestDeveloperSetting(database, 'is_free_celebrations_enabled', 1);

    start();

    const duration = calculateCulturePointsCelebrationDuration({
      celebrationType,
      townHallLevel,
      serverSpeed: serverMock.configuration.speed,
    });
    const endsAt = now + duration;

    expect(get()).toStrictEqual({ celebrationType, endsAt });
    expect(start).toThrow('Town Hall is already holding a celebration');
    expect(
      database.selectValue({
        sql: "SELECT COUNT(*) FROM events WHERE type = 'culturePointsCelebration';",
        schema: z.number(),
      }),
    ).toBe(0);

    clock.mockReturnValue(endsAt);

    expect(get()).toBeNull();

    start();

    expect(get()).toStrictEqual({ celebrationType, endsAt: endsAt + duration });

    updateDeveloperSettings(
      database,
      createControllerArgs<
        '/developer-settings/:developerSettingName',
        'patch'
      >({
        path: { developerSettingName: 'isInstantCelebrationsEnabled' },
        body: { value: true },
      }),
    );

    expect(get()).toBeNull();

    start();

    expect(get()).toBeNull();
  },
);
