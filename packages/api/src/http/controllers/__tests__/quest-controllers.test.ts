import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { assessQueuedTroopCountQuestCompletion } from '../../../utils/quests';
import {
  collectQuest,
  getCollectableQuestCount,
  getQuests,
} from '../quest-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('quest-controllers', () => {
  test('getQuests should return quests for a village', async () => {
    using database = await prepareTestDatabase();

    const villageId = database.selectValue({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.number(),
    })!;

    const quests = getQuests(
      database,
      createControllerArgs<'/me/quests'>({
        query: { villageId },
      }),
    );

    expect(quests.length).toBeGreaterThan(0);
    expect(quests).toContainEqual({
      id: 'adventureCount-1',
      completedAt: null,
      collectedAt: null,
      scope: 'global',
      progress: 0,
    });

    expect(quests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'killCount-10', progress: 0 }),
        expect.objectContaining({
          id: 'unitKillCount-PHALANX-10',
          progress: 0,
        }),
      ]),
    );
  });

  test('getQuests reports partial progress from each tracked quest requirement', async () => {
    using database = await prepareTestDatabase();

    const villageId = database.selectValue({
      sql: 'SELECT id FROM villages WHERE player_id = 1 LIMIT 1;',
      schema: z.number(),
    })!;

    database.execMulti({
      sql: `
        UPDATE hero_adventures SET completed = 19
        WHERE hero_id IN (SELECT id FROM heroes WHERE player_id = 1);

        UPDATE culture_points SET celebrations_held = 2 WHERE player_id = 1;

        INSERT INTO hunting_capture_history (player_id, unit_id, amount)
        SELECT 1, id, 3 FROM unit_ids WHERE unit IN ('RAT', 'TIGER');

        INSERT INTO gathering_resource_totals (player_id, amount) VALUES (1, 17);

        INSERT INTO enemy_casualty_totals (player_id, unit_id, amount)
        SELECT 1, id, CASE unit WHEN 'PHALANX' THEN 4 ELSE 3 END
        FROM unit_ids WHERE unit IN ('PHALANX', 'LEGIONNAIRE');

        INSERT INTO enemy_casualty_totals (player_id, unit_id, amount)
        SELECT p.id, ui.id, 50 FROM players p CROSS JOIN unit_ids ui
        WHERE p.id <> 1 AND ui.unit = 'PHALANX' LIMIT 1;
      `,
    });

    database.exec({
      sql: `
        INSERT INTO unit_training_history (village_id, batch_id, unit_id, building_id, amount, timestamp)
        SELECT $village_id, 'quest-test-' || bi.building, ui.id, bi.id,
          CASE WHEN bi.building = 'BARRACKS' THEN 3 ELSE 10 END, 1
        FROM unit_ids ui CROSS JOIN building_ids bi
        WHERE ui.unit = 'PHALANX' AND bi.building IN ('BARRACKS', 'HOSPITAL', 'ASCLEPEION');
      `,
      bind: { $village_id: villageId },
    });

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES
          ('troopTraining', 1, 2, $village_id, '{"unitId":"PHALANX","amount":2}'),
          ('troopTraining', 2, 2, $village_id, '{"unitId":"PHALANX","buildingId":"BARRACKS"}'),
          ('troopTraining', 3, 2, $village_id, '{"unitId":"PHALANX","buildingId":"HOSPITAL"}'),
          ('troopTraining', 4, 2, $village_id, '{"unitId":"PHALANX","buildingId":"ASCLEPEION"}');
      `,
      bind: { $village_id: villageId },
    });

    database.exec({
      sql: `
        UPDATE building_fields SET level = CASE WHEN field_id = (
          SELECT MIN(field_id) FROM building_fields
          WHERE village_id = $village_id AND building_id = building_ids.id
        ) THEN 2 ELSE 1 END
        FROM building_ids
        WHERE village_id = $village_id AND building_id = building_ids.id
          AND building_ids.building = 'WOODCUTTER';
      `,
      bind: { $village_id: villageId },
    });

    assessQueuedTroopCountQuestCompletion(database, 'PHALANX', 10, 1);

    const quests = getQuests(
      database,
      createControllerArgs<'/me/quests'>({ query: { villageId } }),
    );

    const progress = Object.fromEntries(
      quests.map(({ id, progress }) => [id, progress]),
    );

    expect(progress).toMatchObject({
      'adventureCount-20': 19,
      'celebrationCount-3': 2,
      'queuedTroopCount-10': 5,
      'queuedTroopCountById-PHALANX-10': 5,
      'killCount-10': 7,
      'unitKillCount-PHALANX-10': 4,
      'unitKillCount-LEGIONNAIRE-10': 3,
      'unitKillCount-TIGER-10': 0,
      'captureAnimalCountById-TIGER-5': 3,
      'captureAnimalCountById-ELEPHANT-5': 0,
      'captureAnimalKindCount-10': 2,
      'gatheredResourceCount-20': 17,
      'oneOf-WOODCUTTER-4': 2,
      'every-WOODCUTTER-3': 1,
      'oneOf-BARRACKS-1': 0,
    });

    expect(quests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'queuedTroopCount-10',
          completedAt: null,
        }),
        expect.objectContaining({
          id: 'queuedTroopCountById-PHALANX-10',
          completedAt: null,
        }),
      ]),
    );
  });

  test('getCollectableQuestCount should return collectable quest count', async () => {
    using database = await prepareTestDatabase();

    const villageId = database.selectValue({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.number(),
    })!;

    // 1. Initially, let's see how many collectable quests there are for this village
    // It should include global quests (village_id IS NULL) and village-specific quests.
    const { collectableQuestCount: initialCount } = getCollectableQuestCount(
      database,
      createControllerArgs<'/me/quests/collectable-count'>({
        query: { villageId },
      }),
    );

    // 2. Add a global collectable quest
    database.exec({
      sql: `
        INSERT INTO
          quests (player_id, quest_id, completed_at, village_id)
        VALUES
          (1, $quest_id, $completed_at, NULL)
      `,
      bind: {
        $quest_id: 'test-global-quest',
        $completed_at: Date.now(),
      },
    });

    // 3. Add a village-specific collectable quest for our village
    database.exec({
      sql: `
        INSERT INTO
          quests (player_id, quest_id, completed_at, village_id)
        VALUES
          (1, $quest_id, $completed_at, $village_id)
      `,
      bind: {
        $quest_id: 'test-village-quest',
        $completed_at: Date.now(),
        $village_id: villageId,
      },
    });

    // 4. Add a village-specific collectable quest for ANOTHER village (should NOT be counted)
    database.exec({
      sql: `
        INSERT INTO
          quests (player_id, quest_id, completed_at, village_id)
        VALUES
          (1, $quest_id, $completed_at, $village_id)
      `,
      bind: {
        $quest_id: 'test-other-village-quest',
        $completed_at: Date.now(),
        $village_id: villageId + 1, // Assumes village.id + 1 exists or doesn't violate FK (test db usually doesn't have strict FKs or we can just use a number)
      },
    });

    const { collectableQuestCount: finalCount } = getCollectableQuestCount(
      database,
      createControllerArgs<'/me/quests/collectable-count'>({
        query: { villageId },
      }),
    );

    expect(finalCount).toBe(initialCount + 2);
  });

  test('collectQuest should collect a quest', async () => {
    using database = await prepareTestDatabase();

    const villageId = database.selectValue({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.number(),
    })!;

    const questId = 'gatheredResourceCount-1';

    database.exec({
      sql: `
        INSERT INTO quests (player_id, quest_id, completed_at, village_id)
        VALUES (1, $quest_id, $completed_at, $village_id);
      `,
      bind: {
        $quest_id: questId,
        $completed_at: Date.now(),
        $village_id: villageId,
      },
    });

    collectQuest(
      database,
      createControllerArgs<'/me/quests/:questId/collect', 'post'>({
        path: { questId },
        body: { villageId },
      }),
    );

    expect(
      database.selectValue({
        sql: 'SELECT collected_at FROM quests WHERE quest_id = $quest_id;',
        bind: { $quest_id: questId },
        schema: z.number().nullable(),
      }),
    ).not.toBeNull();
  });
});
