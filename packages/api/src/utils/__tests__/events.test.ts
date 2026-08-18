import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  calculateBuildingDestructionDuration,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import {
  calculateHeroLevel,
  calculateHeroRevivalCost,
  calculateHeroRevivalTime,
} from '@pillage-first/game-assets/utils/hero';
import {
  ANIMAL_CAGE_BASE_DURATION,
  ANIMAL_CAGE_COST,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import {
  TRAPPER_CAGE_BASE_DURATION,
  TRAPPER_CAGE_COST,
} from '@pillage-first/game-assets/utils/trapper';
import {
  createBuildingConstructionEventMock,
  createBuildingDestructionEventMock,
  createBuildingLevelChangeEventMock,
  createGameEventMock,
  createHeroHealthRegenerationEventMock,
  createHeroRevivalEventMock,
  createTroopMovementAdventureEventMock,
  createTroopMovementAttackEventMock,
  createTroopMovementFindNewVillageEventMock,
  createTroopMovementRaidEventMock,
  createTroopMovementRelocationEventMock,
  createTroopTrainingEventMock,
  createUnitImprovementEventMock,
  createUnitResearchEventMock,
} from '@pillage-first/mocks/event';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { resourcesSchema } from '@pillage-first/types/models/resource';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { Unit } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../create-event';
import {
  getEventCost,
  getEventDuration,
  getEventResourceSubtractionTimestamp,
  getEventStartTime,
  insertEvents,
  runEventCreationSideEffects,
  validateEventCreationPrerequisites,
} from '../events';

const getAnyVillageId = (database: DbFacade): number => {
  return database.selectValue({
    sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1;',
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  })!;
};

const getTileIdByCoordinates = (
  database: DbFacade,
  coordinates: { x: number; y: number },
): number => {
  return database.selectValue({
    sql: 'SELECT id FROM tiles WHERE x = $x AND y = $y;',
    bind: { $x: coordinates.x, $y: coordinates.y },
    schema: z.number(),
  })!;
};

const getAnyVillageWithTile = (
  database: DbFacade,
): { id: number; tileId: number } => {
  return database.selectObject({
    sql: `
      SELECT id, tile_id AS tileId
      FROM villages
      WHERE player_id = $player_id
      ORDER BY id
      LIMIT 1;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: z.strictObject({
      id: z.number(),
      tileId: z.number(),
    }),
  })!;
};

const setDevFlag = (database: DbFacade, column: string, value: number) => {
  database.exec({
    sql: `UPDATE developer_settings SET ${column} = $value`,
    bind: { $value: value },
  });
};

const setHuntersLodgeLevel = (
  database: DbFacade,
  villageId: number,
  level: number,
) => {
  database.exec({
    sql: `
      INSERT INTO
        building_fields (village_id, field_id, building_id, level)
      SELECT
        $village_id, 20, id, $level
      FROM
        building_ids
      WHERE
        building = 'HUNTERS_LODGE'
      ON CONFLICT(village_id, field_id) DO UPDATE SET
        building_id = EXCLUDED.building_id,
        level = EXCLUDED.level;
    `,
    bind: {
      $village_id: villageId,
      $level: level,
    },
  });
};

const setVillageBuildingLevel = (
  database: DbFacade,
  villageId: number,
  buildingId: string,
  level: number,
  fieldId = 20,
) => {
  database.exec({
    sql: `
      INSERT INTO
        building_fields (village_id, field_id, building_id, level)
      SELECT
        $village_id, $field_id, id, $level
      FROM
        building_ids
      WHERE
        building = $building_id
      ON CONFLICT(village_id, field_id) DO UPDATE SET
        building_id = EXCLUDED.building_id,
        level = EXCLUDED.level;
    `,
    bind: {
      $village_id: villageId,
      $field_id: fieldId,
      $building_id: buildingId,
      $level: level,
    },
  });
};

const setWoundedTroopAmount = (
  database: DbFacade,
  villageId: number,
  unitId: Unit['id'],
  amount: number,
  updatedAt = Date.now() + 60_000,
) => {
  database.exec({
    sql: `
      DELETE FROM wounded_troops
      WHERE
        village_id = $village_id
        AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id);
    `,
    bind: {
      $village_id: villageId,
      $unit_id: unitId,
    },
  });

  database.exec({
    sql: `
      INSERT INTO wounded_troops (village_id, unit_id, amount, updated_at)
      VALUES (
        $village_id,
        (SELECT id FROM unit_ids WHERE unit = $unit_id),
        $amount,
        $updated_at
      );
    `,
    bind: {
      $village_id: villageId,
      $unit_id: unitId,
      $amount: amount,
      $updated_at: updatedAt,
    },
  });
};

describe('events utils', () => {
  describe(validateEventCreationPrerequisites, () => {
    test('unitImprovement - should throw if smithy is busy', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE building_fields
          SET
            building_id = (SELECT id FROM building_ids WHERE building = 'SMITHY'),
            level = 1
          WHERE
            village_id = $village_id
            AND field_id = (
              SELECT field_id
              FROM building_fields
              WHERE village_id = $village_id
              LIMIT 1
            );
        `,
        bind: { $village_id: villageId },
      });

      const startsAt = 1000;
      const duration = 500;
      insertEvents(database, [
        createUnitImprovementEventMock({
          id: 99_001,
          villageId,
          startsAt,
          duration,
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitImprovementEventMock({
            villageId,
          }),
        ),
      ).toThrow('Smithy is busy');
    });

    test('unitImprovement - should return true if smithy is idle', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE building_fields
          SET
            building_id = (SELECT id FROM building_ids WHERE building = 'SMITHY'),
            level = 1
          WHERE
            village_id = $village_id
            AND field_id = (
              SELECT field_id
              FROM building_fields
              WHERE village_id = $village_id
              LIMIT 1
            );
        `,
        bind: { $village_id: villageId },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitImprovementEventMock({
            villageId,
          }),
        ),
      ).not.toThrow();
    });

    test('unitImprovement - should throw if target level exceeds 20', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitImprovementEventMock({
            villageId,
            level: 21,
          }),
        ),
      ).toThrow('Unit upgrade level cannot exceed 20');
    });

    test('unitImprovement - should throw if smithy level is lower than requested upgrade level', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE building_fields
          SET
            building_id = (SELECT id FROM building_ids WHERE building = 'SMITHY'),
            level = 1
          WHERE
            village_id = $village_id
            AND field_id = (
              SELECT field_id
              FROM building_fields
              WHERE village_id = $village_id
              LIMIT 1
            );
        `,
        bind: { $village_id: villageId },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitImprovementEventMock({
            villageId,
            level: 2,
          }),
        ),
      ).toThrow('Smithy level is too low for this unit upgrade');
    });

    test('unitResearch - should throw if academy is busy', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const startsAt = 2000;
      const duration = 500;
      insertEvents(database, [
        createUnitResearchEventMock({
          id: 99_101,
          villageId,
          unitId: 'PHALANX',
          startsAt,
          duration,
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'PHALANX',
          }),
        ),
      ).toThrow('Academy is busy');
    });

    test('unitResearch - should throw if unit is already researched', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `INSERT INTO unit_research (village_id, unit_id)
              VALUES ($village_id, (SELECT id FROM unit_ids WHERE unit = $unit))`,
        bind: { $village_id: villageId, $unit: 'PHALANX' },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'PHALANX',
          }),
        ),
      ).toThrow('Unit is already researched');
    });

    test('unitResearch - should not throw if academy idle and unit not researched', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      database.exec({
        sql: `DELETE FROM unit_research
              WHERE village_id = $village_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit)`,
        bind: { $village_id: villageId, $unit: 'PHALANX' },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'PHALANX',
          }),
        ),
      ).not.toThrow();
    });

    test('unitResearch - should throw if unit does not belong to village tribe', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'LEGIONNAIRE',
          }),
        ),
      ).toThrow('Unit does not belong to village tribe');
    });

    test('unitResearch - should throw if research building requirements are missing', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setVillageBuildingLevel(database, villageId, 'ACADEMY', 2);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'SWORDSMAN',
          }),
        ),
      ).toThrow('Unit research requirements are not met');
    });

    test('unitResearch - should not throw if research building requirements are met', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setVillageBuildingLevel(database, villageId, 'ACADEMY', 3);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'SWORDSMAN',
          }),
        ),
      ).not.toThrow();
    });

    test('troopTraining - should throw if unit does not belong to village tribe', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const event = createTroopTrainingEventMock({
        villageId,
        unitId: 'LEGIONNAIRE',
      });

      expect(() => validateEventCreationPrerequisites(database, event)).toThrow(
        'Unit does not belong to village tribe',
      );
    });

    test('troopTraining - should throw if unit is not researched', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const event = createTroopTrainingEventMock({
        villageId,
        unitId: 'SWORDSMAN',
      });

      expect(() => validateEventCreationPrerequisites(database, event)).toThrow(
        'Unit is not researched',
      );
    });

    test('troopTraining - should throw if training building does not match unit category', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setVillageBuildingLevel(database, villageId, 'STABLE', 1);

      const event = createTroopTrainingEventMock({
        villageId,
        unitId: 'PHALANX',
        buildingId: 'STABLE',
        durationEffectId: 'stableTrainingDuration',
      });

      expect(() => validateEventCreationPrerequisites(database, event)).toThrow(
        'Unit training building does not match unit category',
      );
    });

    test('troopTraining - should throw if duration effect does not match training building', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setVillageBuildingLevel(database, villageId, 'BARRACKS', 1);

      const event = createTroopTrainingEventMock({
        villageId,
        unitId: 'PHALANX',
        buildingId: 'BARRACKS',
        durationEffectId: 'stableTrainingDuration',
      });

      expect(() => validateEventCreationPrerequisites(database, event)).toThrow(
        'Unit training duration effect does not match building',
      );
    });

    test('troopTraining - should throw if recruitment building requirements are missing', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setVillageBuildingLevel(database, villageId, 'RESIDENCE', 9);

      const event = createTroopTrainingEventMock({
        villageId,
        unitId: 'GAUL_SETTLER',
        buildingId: 'RESIDENCE',
        durationEffectId: 'residenceTrainingDuration',
      });

      expect(() => validateEventCreationPrerequisites(database, event)).toThrow(
        'Unit recruitment requirements are not met',
      );
    });

    test('troopTraining - should throw if healing unit is not researched', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setVillageBuildingLevel(database, villageId, 'HOSPITAL', 10);
      setWoundedTroopAmount(database, villageId, 'SWORDSMAN', 5);

      const event = createTroopTrainingEventMock({
        villageId,
        buildingId: 'HOSPITAL',
        durationEffectId: 'hospitalTrainingDuration',
        unitId: 'SWORDSMAN',
        amount: 5,
      });

      expect(() => validateEventCreationPrerequisites(database, event)).toThrow(
        'Unit is not researched',
      );
    });

    test('troopTraining - should throw if healing more troops than are wounded', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setVillageBuildingLevel(database, villageId, 'HOSPITAL', 10);
      setWoundedTroopAmount(database, villageId, 'PHALANX', 4);

      const event = createTroopTrainingEventMock({
        villageId,
        buildingId: 'HOSPITAL',
        durationEffectId: 'hospitalTrainingDuration',
        unitId: 'PHALANX',
        amount: 5,
      });

      expect(() => validateEventCreationPrerequisites(database, event)).toThrow(
        'Not enough wounded troops available',
      );
    });

    test('buildingLevelChange - should throw if target level exceeds max level', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const { maxLevel } = getBuildingDefinition('MAIN_BUILDING');

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingId: 'MAIN_BUILDING',
            level: maxLevel + 1,
          }),
        ),
      ).toThrow('Building level cannot exceed max level');
    });

    test('buildingConstruction - should throw if target level exceeds max level', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const { maxLevel } = getBuildingDefinition('MAIN_BUILDING');

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingId: 'MAIN_BUILDING',
            level: maxLevel + 1,
          }),
        ),
      ).toThrow('Building level cannot exceed max level');
    });

    test('buildingConstruction - should throw if building field is already occupied', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const occupiedBuildingFieldId = database.selectValue({
        sql: `
          SELECT field_id
          FROM
            building_fields
          WHERE
            village_id = $village_id
            AND level > 0
          LIMIT 1;
        `,
        bind: { $village_id: villageId },
        schema: z.number(),
      })!;

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId: occupiedBuildingFieldId,
          }),
        ),
      ).toThrow('Building field is already occupied');
    });

    test('buildingConstruction - should not throw if building field is not occupied', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const buildingFieldId = database.selectValue({
        sql: `
          SELECT field_id
          FROM
            building_fields
          WHERE
            village_id = $village_id
          LIMIT 1;
        `,
        bind: { $village_id: villageId },
        schema: z.number(),
      })!;

      database.exec({
        sql: `
          UPDATE building_fields
          SET level = 0
          WHERE village_id = $village_id
            AND field_id = $field_id;
        `,
        bind: {
          $village_id: villageId,
          $field_id: buildingFieldId,
        },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId,
            buildingId: 'WAREHOUSE',
          }),
        ),
      ).not.toThrow();
    });

    test('buildingConstruction - should throw if building requirements are missing', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const buildingFieldId = 25;

      database.exec({
        sql: `
          DELETE FROM effects
          WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
            AND source_specifier = $field_id;
          DELETE FROM building_fields
          WHERE village_id = $village_id AND field_id = $field_id;
        `,
        bind: {
          $village_id: villageId,
          $field_id: buildingFieldId,
        },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId,
            buildingId: 'BARRACKS',
          }),
        ),
      ).toThrow('Building requirements are not met');
    });

    test('buildingLevelChange - should not check construction requirements for level ups', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const buildingFieldId = 25;

      database.exec({
        sql: `
          INSERT OR REPLACE INTO building_fields (
            village_id,
            field_id,
            building_id,
            level
          )
          VALUES (
            $village_id,
            $field_id,
            (SELECT id FROM building_ids WHERE building = 'BARRACKS'),
            1
          );
        `,
        bind: {
          $village_id: villageId,
          $field_id: buildingFieldId,
        },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingFieldId,
            buildingId: 'BARRACKS',
            previousLevel: 1,
            level: 2,
          }),
        ),
      ).not.toThrow();
    });

    test('troopMovementAdventure - should throw if no adventure points are available', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE hero_adventures
          SET available = 0
          WHERE hero_id = (
            SELECT id
            FROM heroes
            WHERE player_id = $player_id
          )
        `,
        bind: { $player_id: PLAYER_ID },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementAdventureEventMock({ villageId }),
        ),
      ).toThrow('No adventure points available');
    });

    test("huntersLodgeHunt - should throw if party level exceeds Hunter's Lodge level", async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      setHuntersLodgeLevel(database, villageId, 2);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createGameEventMock('huntersLodgeHunt', {
            villageId,
            huntingPartyLevel: 3,
          }),
        ),
      ).toThrow("Hunter's Lodge level is too low");
    });

    test("huntersLodgeHunt - should throw if Hunter's Lodge is already hunting", async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      setHuntersLodgeLevel(database, villageId, 2);
      insertEvents(database, [
        createGameEventMock('huntersLodgeHunt', {
          villageId,
          huntingPartyLevel: 1,
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createGameEventMock('huntersLodgeHunt', {
            villageId,
            huntingPartyLevel: 1,
          }),
        ),
      ).toThrow("Hunter's Lodge is busy");
    });

    test('isBuildingEvent - non-Romans should throw if building queue is full', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      // Set tribe to Teutons (not Romans)
      database.exec({
        sql: `
          UPDATE players
          SET tribe_id = (SELECT id FROM tribe_ids WHERE tribe = 'teutons')
          WHERE id = (SELECT player_id FROM villages WHERE id = $village_id)
        `,
        bind: { $village_id: villageId },
      });

      insertEvents(database, [
        createBuildingConstructionEventMock({
          villageId,
          buildingFieldId: 1, // resource field
          buildingId: 'WOODCUTTER',
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId: 19, // village building
            buildingId: 'WAREHOUSE',
          }),
        ),
      ).toThrow('Building construction queue is full');
    });

    test('isBuildingEvent - Romans should not throw if one resource and one village building are in queue', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      // Set tribe to Romans
      database.exec({
        sql: `
          UPDATE players
          SET tribe_id = (SELECT id FROM tribe_ids WHERE tribe = 'romans')
          WHERE id = (SELECT player_id FROM villages WHERE id = $village_id)
        `,
        bind: { $village_id: villageId },
      });

      insertEvents(database, [
        createBuildingConstructionEventMock({
          villageId,
          buildingFieldId: 1, // resource field
          buildingId: 'WOODCUTTER',
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId: 19, // village building
            buildingId: 'WAREHOUSE',
          }),
        ),
      ).not.toThrow();
    });

    test('isBuildingEvent - Romans should throw if two resource field events are in queue', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      // Set tribe to Romans
      database.exec({
        sql: `
          UPDATE players
          SET tribe_id = (SELECT id FROM tribe_ids WHERE tribe = 'romans')
          WHERE id = (SELECT player_id FROM villages WHERE id = $village_id)
        `,
        bind: { $village_id: villageId },
      });

      insertEvents(database, [
        createBuildingConstructionEventMock({
          villageId,
          buildingFieldId: 1, // resource field
          buildingId: 'WOODCUTTER',
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId: 2, // another resource field
            buildingId: 'WHEAT_FIELD',
          }),
        ),
      ).toThrow('Building construction queue is full');
    });

    test('isBuildingEvent - Romans should throw if two village building events are in queue', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      // Set tribe to Romans
      database.exec({
        sql: `
          UPDATE players
          SET tribe_id = (SELECT id FROM tribe_ids WHERE tribe = 'romans')
          WHERE id = (SELECT player_id FROM villages WHERE id = $village_id)
        `,
        bind: { $village_id: villageId },
      });

      insertEvents(database, [
        createBuildingConstructionEventMock({
          villageId,
          buildingFieldId: 19, // village building
          buildingId: 'WAREHOUSE',
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingFieldId: 20, // another village building
          }),
        ),
      ).toThrow('Building construction queue is full');
    });

    test('isBuildingEvent - should not throw if only downgrade event is in queue', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      // Set tribe to Teutons (not Romans) so queue is shared
      database.exec({
        sql: `
          UPDATE players
          SET tribe_id = (SELECT id FROM tribe_ids WHERE tribe = 'teutons')
          WHERE id = (SELECT player_id FROM villages WHERE id = $village_id)
        `,
        bind: { $village_id: villageId },
      });

      insertEvents(database, [
        createBuildingLevelChangeEventMock({
          villageId,
          buildingFieldId: 19,
          previousLevel: 2,
          level: 1,
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingFieldId: 20,
          }),
        ),
      ).not.toThrow();
    });

    test('isBuildingEvent - should not throw if only buildingDestruction event is in queue', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      insertEvents(database, [
        createBuildingDestructionEventMock({
          villageId,
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingFieldId: 20,
          }),
        ),
      ).not.toThrow();
    });

    test('isBuildingDowngradeEvent - should throw if main building level is lower than 10', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE building_fields
          SET level = 9
          WHERE village_id = $village_id
          AND building_id = (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING')
        `,
        bind: { $village_id: villageId },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            previousLevel: 2,
            level: 1,
          }),
        ),
      ).toThrow('Main building level 10 is required to downgrade buildings');
    });

    test('isBuildingDowngradeEvent - should not throw if main building level is at least 10', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE building_fields
          SET level = 10
          WHERE village_id = $village_id
          AND building_id = (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING')
        `,
        bind: { $village_id: villageId },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            previousLevel: 2,
            level: 1,
          }),
        ),
      ).not.toThrow();
    });

    test('isBuildingDowngradeEvent - should throw if another downgrade event is already in queue', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE building_fields
          SET level = 10
          WHERE village_id = $village_id
          AND building_id = (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING')
        `,
        bind: { $village_id: villageId },
      });

      insertEvents(database, [
        createBuildingLevelChangeEventMock({
          villageId,
          previousLevel: 2,
          level: 1,
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            previousLevel: 3,
            level: 2,
          }),
        ),
      ).toThrow('Main building is busy');
    });

    test('isBuildingDowngradeEvent - should throw if a building destruction event is already in queue', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE building_fields
          SET level = 10
          WHERE village_id = $village_id
          AND building_id = (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING')
        `,
        bind: { $village_id: villageId },
      });

      insertEvents(database, [
        createBuildingDestructionEventMock({
          villageId,
          previousLevel: 10,
          level: 0,
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            previousLevel: 2,
            level: 1,
          }),
        ),
      ).toThrow('Main building is busy');
    });

    test('isBuildingDestructionEvent - should throw if a building downgrade event is already in queue', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE building_fields
          SET level = 10
          WHERE village_id = $village_id AND field_id = 38;
        `,
        bind: { $village_id: villageId },
      });

      insertEvents(database, [
        createBuildingLevelChangeEventMock({
          villageId,
          previousLevel: 2,
          level: 1,
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingDestructionEventMock({
            villageId,
          }),
        ),
      ).toThrow('Main building is busy');
    });

    test('isBuildingDestructionEvent - should throw if building destruction is already in progress', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE building_fields
          SET level = 10
          WHERE village_id = $village_id AND field_id = 38;
        `,
        bind: { $village_id: villageId },
      });

      insertEvents(database, [
        createBuildingDestructionEventMock({
          villageId,
          previousLevel: 10,
          level: 0,
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingDestructionEventMock({
            villageId,
            previousLevel: 9,
            level: 0,
          }),
        ),
      ).toThrow('Main building is busy');
    });

    test('troopMovementAdventure - should not throw if adventure points are available', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE hero_adventures
          SET available = 1
          WHERE hero_id = (
            SELECT id
            FROM heroes
            WHERE player_id = $player_id
          )
        `,
        bind: { $player_id: PLAYER_ID },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementAdventureEventMock({ villageId }),
        ),
      ).not.toThrow();
    });

    test('troopMovementAdventure - should throw if hero is reinforcing another village', async () => {
      const database = await prepareTestDatabase();

      const homeVillage = database.selectObject({
        sql: `
          SELECT id, tile_id
          FROM villages
          WHERE player_id = $player_id
          ORDER BY id
          LIMIT 1;
        `,
        bind: { $player_id: PLAYER_ID },
        schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
      })!;

      const reinforcedVillage = database.selectObject({
        sql: `
          WITH free_tile AS (
            SELECT id
            FROM tiles
            WHERE id != $home_tile_id
              AND id NOT IN (SELECT tile_id FROM villages)
            ORDER BY id
            LIMIT 1
          )
          INSERT INTO villages (name, slug, tile_id, player_id)
          VALUES (
            'Reinforced Adventure Validation Village',
            'reinforced-adventure-validation-village-test',
            (SELECT id FROM free_tile),
            $player_id
          )
          RETURNING id, tile_id;
        `,
        bind: {
          $home_tile_id: homeVillage.tile_id,
          $player_id: PLAYER_ID,
        },
        schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
      })!;

      database.exec({
        sql: `
          UPDATE hero_adventures
          SET available = 1
          WHERE hero_id = (
            SELECT id
            FROM heroes
            WHERE player_id = $player_id
          )
        `,
        bind: { $player_id: PLAYER_ID },
      });

      database.exec({
        sql: "DELETE FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'HERO');",
      });

      database.exec({
        sql: `
          UPDATE heroes
          SET village_id = $village_id
          WHERE player_id = $player_id;
        `,
        bind: {
          $village_id: homeVillage.id,
          $player_id: PLAYER_ID,
        },
      });

      database.exec({
        sql: `
          INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
          VALUES (
            $tile_id,
            $source_tile_id,
            (SELECT id FROM unit_ids WHERE unit = 'HERO'),
            1
          );
        `,
        bind: {
          $tile_id: reinforcedVillage.tile_id,
          $source_tile_id: homeVillage.tile_id,
        },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementAdventureEventMock({ villageId: homeVillage.id }),
        ),
      ).toThrow('Hero is not stationed in his home village');
    });

    test('troopMovementOasisOccupation - should throw if no free oasis occupation slots', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: 'UPDATE oasis SET village_id = null WHERE village_id = $village_id;',
        bind: { $village_id: villageId },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createGameEventMock('troopMovementOasisOccupation', {
            villageId,
            targetTileId: getTileIdByCoordinates(database, { x: 1, y: 1 }),
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, sourceTileId: 1 }],
          }),
        ),
      ).toThrow('No free oasis occupation slots available');
    });

    test('troopMovementOasisOccupation - should not throw if free oasis occupation slot exists', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE building_fields
          SET
            building_id = (SELECT id FROM building_ids WHERE building = 'HEROS_MANSION'),
            level = 10
          WHERE field_id = (
            SELECT field_id
            FROM building_fields
            WHERE village_id = $village_id
            LIMIT 1
          );
        `,
        bind: { $village_id: villageId },
      });

      database.exec({
        sql: 'UPDATE oasis SET village_id = null WHERE village_id = $village_id;',
        bind: { $village_id: villageId },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createGameEventMock('troopMovementOasisOccupation', {
            villageId,
            targetTileId: getTileIdByCoordinates(database, { x: 1, y: 1 }),
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, sourceTileId: 1 }],
          }),
        ),
      ).not.toThrow();
    });

    test('troopMovementOasisOccupation - should throw if all slots are already used', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          UPDATE building_fields
          SET
            building_id = (SELECT id FROM building_ids WHERE building = 'HEROS_MANSION'),
            level = 10
          WHERE field_id = (
            SELECT field_id
            FROM building_fields
            WHERE village_id = $village_id
            LIMIT 1
          );
        `,
        bind: { $village_id: villageId },
      });

      database.exec({
        sql: 'UPDATE oasis SET village_id = null WHERE village_id = $village_id;',
        bind: { $village_id: villageId },
      });

      database.exec({
        sql: `
          UPDATE oasis
          SET village_id = $village_id
          WHERE tile_id = (SELECT tile_id FROM oasis LIMIT 1);
        `,
        bind: { $village_id: villageId },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createGameEventMock('troopMovementOasisOccupation', {
            villageId,
            targetTileId: getTileIdByCoordinates(database, { x: 1, y: 1 }),
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, sourceTileId: 1 }],
          }),
        ),
      ).toThrow('No free oasis occupation slots available');
    });

    test('troopMovementAttack - should throw if target is not village or oasis', async () => {
      const database = await prepareTestDatabase();

      database.exec({
        sql: 'DELETE FROM villages WHERE tile_id = (SELECT id FROM tiles WHERE x = 2 AND y = 2)',
      });
      database.exec({
        sql: 'DELETE FROM oasis WHERE tile_id = (SELECT id FROM tiles WHERE x = 2 AND y = 2)',
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementAttackEventMock({
            targetTileId: getTileIdByCoordinates(database, { x: 2, y: 2 }),
          }),
        ),
      ).toThrow('Target must be a village or an oasis');
    });

    test('troopMovementAttack - should not throw if target is village', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const targetTileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $id',
        bind: { $id: villageId },
        schema: z.number(),
      })!;

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementAttackEventMock({ targetTileId }),
        ),
      ).not.toThrow();
    });

    test('troopMovementAttack - should not throw if target is oasis', async () => {
      const database = await prepareTestDatabase();
      const targetTileId = database.selectValue({
        sql: 'SELECT tile_id FROM oasis LIMIT 1',
        schema: z.number(),
      })!;

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementAttackEventMock({ targetTileId }),
        ),
      ).not.toThrow();
    });

    test('troopMovementRaid - should throw if target is not village or oasis', async () => {
      const database = await prepareTestDatabase();

      database.exec({
        sql: 'DELETE FROM villages WHERE tile_id = (SELECT id FROM tiles WHERE x = 2 AND y = 2)',
      });
      database.exec({
        sql: 'DELETE FROM oasis WHERE tile_id = (SELECT id FROM tiles WHERE x = 2 AND y = 2)',
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementRaidEventMock({
            targetTileId: getTileIdByCoordinates(database, { x: 2, y: 2 }),
          }),
        ),
      ).toThrow('Target must be a village or an oasis');
    });

    test('troopMovementRaid - should not throw if target is oasis', async () => {
      const database = await prepareTestDatabase();
      const targetTileId = database.selectValue({
        sql: 'SELECT tile_id FROM oasis LIMIT 1',
        schema: z.number(),
      })!;

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementRaidEventMock({ targetTileId }),
        ),
      ).not.toThrow();
    });

    test('troopMovementFindNewVillage - should throw if target is occupied', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const targetTileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $id',
        bind: { $id: villageId },
        schema: z.number(),
      })!;

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementFindNewVillageEventMock({
            targetTileId,
          }),
        ),
      ).toThrow('Target tile must be unoccupied');
    });

    test('troopMovementOasisOccupation - should throw if target is not oasis', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      // Give some levels to hero's mansion so we don't get "No free oasis occupation slots available" error first
      database.exec({
        sql: `
          UPDATE building_fields
          SET
            building_id = (SELECT id FROM building_ids WHERE building = 'HEROS_MANSION'),
            level = 10
          WHERE field_id = (
            SELECT field_id
            FROM building_fields
            WHERE village_id = $village_id
            LIMIT 1
          );
        `,
        bind: { $village_id: villageId },
      });

      database.exec({
        sql: 'DELETE FROM oasis WHERE tile_id = (SELECT id FROM tiles WHERE x = 2 AND y = 2)',
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createGameEventMock('troopMovementOasisOccupation', {
            villageId,
            targetTileId: getTileIdByCoordinates(database, { x: 2, y: 2 }),
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, sourceTileId: 1 }],
          }),
        ),
      ).toThrow('Target must be an oasis');
    });

    test('troopMovementOasisOccupation - should throw if already occupied by you', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const { targetTileId, x, y } = database.selectObject({
        sql: `
          SELECT t.id AS targetTileId, t.x, t.y
          FROM tiles t
          JOIN oasis o ON o.tile_id = t.id
          LIMIT 1
        `,
        schema: z.strictObject({
          targetTileId: z.number(),
          x: z.number(),
          y: z.number(),
        }),
      })!;

      database.exec({
        sql: 'UPDATE oasis SET village_id = $villageId WHERE tile_id = (SELECT id FROM tiles WHERE x = $x AND y = $y)',
        bind: { $villageId: villageId, $x: x, $y: y },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createGameEventMock('troopMovementOasisOccupation', {
            villageId,
            targetTileId,
          }),
        ),
      ).toThrow('Oasis is already occupied by you');
    });

    test('troopMovementRelocation - should throw if target tile does not exist', async () => {
      const database = await prepareTestDatabase();

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementRelocationEventMock({
            targetTileId: getTileIdByCoordinates(database, { x: 2, y: 2 }),
          }),
        ),
      ).toThrow('Target tile does not exist');
    });

    test('troopMovementRelocation - should throw if target tile is an occupied oasis', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const targetTileId = database.selectValue({
        sql: `
          SELECT tile_id
          FROM oasis
          LIMIT 1;
        `,
        schema: z.number(),
      })!;

      database.exec({
        sql: `
          UPDATE oasis
          SET village_id = $village_id
          WHERE tile_id = $target_tile_id;
        `,
        bind: {
          $target_tile_id: targetTileId,
          $village_id: villageId,
        },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementRelocationEventMock({
            villageId,
            targetTileId,
          }),
        ),
      ).toThrow('Troops can not be relocated to oasis');
    });

    test('return troop movements - should not throw by default', async () => {
      const database = await prepareTestDatabase();
      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createGameEventMock('troopMovementReturn', {
            targetTileId: getTileIdByCoordinates(database, { x: 1, y: 1 }),
            originalMovementType: 'troopMovementReturnReinforcements',
            troops: [
              { unitId: 'LEGIONNAIRE', amount: 1, tileId: 1, sourceTileId: 1 },
            ],
          }),
        ),
      ).not.toThrow();
    });

    test('heroRevival - should throw if hero is already alive', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: 'UPDATE heroes SET health = 100 WHERE player_id = $player_id',
        bind: { $player_id: PLAYER_ID },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createHeroRevivalEventMock({
            villageId,
          }),
        ),
      ).toThrow('Hero is already alive');
    });

    test('heroRevival - should not throw if hero is dead', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: 'UPDATE heroes SET health = 0 WHERE player_id = $player_id',
        bind: { $player_id: PLAYER_ID },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createHeroRevivalEventMock({
            villageId,
          }),
        ),
      ).not.toThrow();
    });
  });

  describe(runEventCreationSideEffects, () => {
    test('troopMovementAdventure - should materialize accrued points before spending one', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const heroId = database.selectValue({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: PLAYER_ID },
        schema: z.number(),
      })!;

      vi.useFakeTimers();
      vi.setSystemTime(new Date(9 * 60 * 60 * 1000));

      database.exec({
        sql: 'UPDATE servers SET created_at = 0',
      });

      database.exec({
        sql: `
          UPDATE hero_adventures
          SET available = 3, last_updated_at = 0
          WHERE hero_id = $hero_id
        `,
        bind: { $hero_id: heroId },
      });

      runEventCreationSideEffects(database, [
        createTroopMovementAdventureEventMock({ villageId }),
      ]);

      const adventures = database.selectObject({
        sql: `
          SELECT available, last_updated_at AS lastUpdatedAt
          FROM hero_adventures
          WHERE hero_id = $hero_id
        `,
        bind: { $hero_id: heroId },
        schema: z.strictObject({
          available: z.number(),
          lastUpdatedAt: z.number(),
        }),
      })!;

      expect(adventures.available).toBe(3);
      expect(adventures.lastUpdatedAt).toBe(9 * 60 * 60 * 1000);

      vi.useRealTimers();
    });

    test('troopMovement - should remove troops for movements', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const villageTileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
        bind: { $village_id: villageId },
        schema: z.number(),
      })!;

      // Seed some troops
      database.exec({
        sql: "DELETE FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE') AND tile_id = $tile_id",
        bind: { $tile_id: villageTileId },
      });
      database.exec({
        sql: `INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
              VALUES ((SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 100, $tile_id, $tile_id)`,
        bind: { $tile_id: villageTileId },
      });

      const event = createGameEventMock('troopMovementAttack', {
        villageId,
        troops: [
          {
            unitId: 'LEGIONNAIRE',
            amount: 40,
            tileId: villageTileId,
            sourceTileId: villageTileId,
          },
        ],
      });

      runEventCreationSideEffects(database, [event]);

      const amount = database.selectValue({
        sql: "SELECT amount FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE') AND tile_id = $tile_id",
        bind: { $tile_id: villageTileId },
        schema: z.number(),
      });

      expect(amount).toBe(60);
    });

    test('troopMovement - should remove troops for multiple movements', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const villageTileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
        bind: { $village_id: villageId },
        schema: z.number(),
      })!;

      // Seed some troops
      database.exec({
        sql: "DELETE FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE') AND tile_id = $tile_id",
        bind: { $tile_id: villageTileId },
      });
      database.exec({
        sql: `INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
              VALUES ((SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 100, $tile_id, $tile_id)`,
        bind: { $tile_id: villageTileId },
      });
      database.exec({
        sql: "DELETE FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'PRAETORIAN') AND tile_id = $tile_id",
        bind: { $tile_id: villageTileId },
      });
      database.exec({
        sql: `INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
              VALUES ((SELECT id FROM unit_ids WHERE unit = 'PRAETORIAN'), 100, $tile_id, $tile_id)`,
        bind: { $tile_id: villageTileId },
      });

      const events = [
        createGameEventMock('troopMovementAttack', {
          villageId,
          troops: [
            {
              unitId: 'LEGIONNAIRE',
              amount: 40,
              tileId: villageTileId,
              sourceTileId: villageTileId,
            },
          ],
        }),
        createGameEventMock('troopMovementRaid', {
          villageId,
          troops: [
            {
              unitId: 'PRAETORIAN',
              amount: 60,
              tileId: villageTileId,
              sourceTileId: villageTileId,
            },
          ],
        }),
      ];

      runEventCreationSideEffects(database, events);

      const getAmount = (unit: Unit['id']) =>
        database.selectValue({
          sql: 'SELECT amount FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unit) AND tile_id = $tile_id',
          bind: { $unit: unit, $tile_id: villageTileId },
          schema: z.number(),
        });

      expect(getAmount('LEGIONNAIRE')).toBe(60);
      expect(getAmount('PRAETORIAN')).toBe(40);
    });

    test('troopTraining - should remove wounded troops when healing is queued', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setWoundedTroopAmount(database, villageId, 'LEGIONNAIRE', 10);

      runEventCreationSideEffects(database, [
        createTroopTrainingEventMock({
          villageId,
          buildingId: 'HOSPITAL',
          durationEffectId: 'hospitalTrainingDuration',
          unitId: 'LEGIONNAIRE',
          amount: 3,
        }),
      ]);

      const amount = database.selectValue({
        sql: `
          SELECT amount
          FROM wounded_troops
          WHERE
            village_id = $village_id
            AND unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE');
        `,
        bind: { $village_id: villageId },
        schema: z.number(),
      });

      expect(amount).toBe(7);
    });
  });

  describe(getEventCost, () => {
    test('buildingLevelUp - should return zero cost if free building construction enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_building_construction_enabled', 1);
      const event = createBuildingLevelChangeEventMock();

      const result = getEventCost(database, event);
      expect(result).toStrictEqual([0, 0, 0, 0]);
    });

    test('buildingLevelUp - should return non-zero cost if free building construction disabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_building_construction_enabled', 0);
      const event = createBuildingLevelChangeEventMock();

      const result = getEventCost(database, event);
      expect(result).toHaveLength(4);
      expect(result.some((v) => v > 0)).toBe(true);
    });

    test('unitResearch - should return zero cost if free unit research enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_unit_research_enabled', 1);
      const event = createUnitResearchEventMock();
      expect(getEventCost(database, event)).toStrictEqual([0, 0, 0, 0]);
    });

    test('unitImprovement - should return zero cost if free unit improvement enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_unit_improvement_enabled', 1);
      const event = createUnitImprovementEventMock();
      expect(getEventCost(database, event)).toStrictEqual([0, 0, 0, 0]);
    });

    test('troopTraining - should return zero cost if free unit training enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_unit_training_enabled', 1);
      const event = createTroopTrainingEventMock({
        amount: 10,
      });
      expect(getEventCost(database, event)).toStrictEqual([0, 0, 0, 0]);
    });

    test('animalCageProduction - should return zero cost if free unit training enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_unit_training_enabled', 1);

      const event = createGameEventMock('animalCageProduction', {
        cageAmount: 2,
      });

      expect(getEventCost(database, event)).toStrictEqual([0, 0, 0, 0]);
    });

    test('trapperCageProduction - should return zero cost if free unit training enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_unit_training_enabled', 1);

      const event = createGameEventMock('trapperCageProduction', {
        cageAmount: 2,
      });

      expect(getEventCost(database, event)).toStrictEqual([0, 0, 0, 0]);
    });

    test('animalCageProduction - should return cost for the full cage batch', async () => {
      const database = await prepareTestDatabase();

      const event = createGameEventMock('animalCageProduction', {
        cageAmount: 2,
      });

      expect(getEventCost(database, event)).toStrictEqual(
        ANIMAL_CAGE_COST.map((cost) => cost * 2),
      );
    });

    test('trapperCageProduction - should return cost for the full cage batch', async () => {
      const database = await prepareTestDatabase();

      const event = createGameEventMock('trapperCageProduction', {
        cageAmount: 2,
      });

      expect(getEventCost(database, event)).toStrictEqual(
        TRAPPER_CAGE_COST.map((cost) => cost * 2),
      );
    });

    test('troopTraining - should return tripled cost for Great Barracks vs Barracks', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_unit_training_enabled', 0);
      const baseEvent = createTroopTrainingEventMock({
        amount: 10,
      });
      const greatEvent = {
        ...baseEvent,
        buildingId: 'GREAT_BARRACKS',
      } as GameEvent<'troopTraining'>;

      const baseCost = getEventCost(database, baseEvent);
      const greatCost = getEventCost(database, greatEvent);

      expect(greatCost).toStrictEqual(baseCost.map((v) => v * 3));
    });

    test('huntersLodgeHunt - should return wheat cost based on party level', async () => {
      const database = await prepareTestDatabase();

      const cost = getEventCost(
        database,
        createGameEventMock('huntersLodgeHunt', {
          huntingPartyLevel: 3,
        }),
      );

      expect(cost).toStrictEqual([0, 0, 0, 300]);
    });

    test('huntersLodgeHunt - should return zero cost if free hunting parties enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_free_hunting_parties_enabled', 1);

      const cost = getEventCost(
        database,
        createGameEventMock('huntersLodgeHunt', {
          huntingPartyLevel: 3,
        }),
      );

      expect(cost).toStrictEqual([0, 0, 0, 0]);
    });

    test('heroRevival - should return correct cost', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const { experience, tribe } = database.selectObject({
        sql: `
          SELECT h.experience, ti.tribe
          FROM
            heroes h
              JOIN players p ON h.player_id = p.id
              JOIN tribe_ids ti ON p.tribe_id = ti.id
          WHERE
            h.player_id = $player_id;
        `,
        bind: { $player_id: PLAYER_ID },
        schema: z.strictObject({
          experience: z.number(),
          tribe: playableTribeSchema,
        }),
      })!;

      const { level } = calculateHeroLevel(experience);
      const expectedCost = calculateHeroRevivalCost(tribe, level);

      const result = getEventCost(
        database,
        createHeroRevivalEventMock({
          villageId,
        }),
      );

      expect(result).toStrictEqual(expectedCost);
    });

    test('heroRevival - should return zero cost if free hero revival enabled', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      setDevFlag(database, 'is_free_hero_revive_enabled', 1);

      const result = getEventCost(
        database,
        createHeroRevivalEventMock({
          villageId,
        }),
      );

      expect(result).toStrictEqual([0, 0, 0, 0]);
    });
  });

  describe(getEventDuration, () => {
    test('buildingConstruction - should return 0', async () => {
      const database = await prepareTestDatabase();
      const event = createGameEventMock('buildingConstruction');
      expect(getEventDuration(database, event)).toBe(0);
    });

    test('buildingDestruction - should return duration based on level and server speed', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: 'UPDATE servers SET speed = $speed',
        bind: { $speed: 2 },
      });

      const event = createBuildingDestructionEventMock({
        villageId,
        previousLevel: 6,
      });

      const expectedDuration = calculateBuildingDestructionDuration(6, 2);
      expect(getEventDuration(database, event)).toBe(expectedDuration);
    });

    test('buildingLevelUp - should return 0 if instant construction enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_building_construction_enabled', 1);
      const event = createBuildingLevelChangeEventMock({
        villageId: getAnyVillageId(database),
      });
      expect(getEventDuration(database, event)).toBe(0);
    });

    test('unitResearch - should return 0 if instant research enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_research_enabled', 1);
      const event = createUnitResearchEventMock({
        villageId: getAnyVillageId(database),
      });
      expect(getEventDuration(database, event)).toBe(0);
    });

    test('unitImprovement - should return 0 if instant improvement enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_improvement_enabled', 1);
      const event = createUnitImprovementEventMock({
        villageId: getAnyVillageId(database),
      });
      expect(getEventDuration(database, event)).toBe(0);
    });

    test('troopTraining - should return 0 if instant training enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_training_enabled', 1);
      const event = createTroopTrainingEventMock({
        villageId: getAnyVillageId(database),
        amount: 10,
      });
      expect(getEventDuration(database, event)).toBe(0);
    });

    test('animalCageProduction - should return 0 if instant unit training enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_training_enabled', 1);

      const event = createGameEventMock('animalCageProduction', {
        cageAmount: 3,
      });

      expect(getEventDuration(database, event)).toBe(0);
    });

    test('trapperCageProduction - should return 0 if instant unit training enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_training_enabled', 1);

      const event = createGameEventMock('trapperCageProduction', {
        cageAmount: 3,
      });

      expect(getEventDuration(database, event)).toBe(0);
    });

    test('buildingLevelUp - should apply effects and return a positive duration', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_building_construction_enabled', 0);
      const event = createBuildingLevelChangeEventMock({
        villageId: getAnyVillageId(database),
      });
      const result = getEventDuration(database, event);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    test('unitResearch - should apply effects and return a positive duration', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_research_enabled', 0);
      const event = createUnitResearchEventMock({
        villageId: getAnyVillageId(database),
      });
      const result = getEventDuration(database, event);
      expect(result).toBeGreaterThan(0);
    });

    test('unitImprovement - should apply effects and return a positive duration', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_improvement_enabled', 0);
      const event = createUnitImprovementEventMock({
        villageId: getAnyVillageId(database),
      });
      const result = getEventDuration(database, event);
      expect(result).toBeGreaterThan(0);
    });

    test('troopTraining - should apply effects and return a positive duration', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_training_enabled', 0);
      const event = createTroopTrainingEventMock({
        villageId: getAnyVillageId(database),
        amount: 10,
      });
      const result = getEventDuration(database, event);
      expect(result).toBeGreaterThan(0);
    });

    test('troopMovementAttack - should apply local speed effects by origin tile id', async () => {
      const database = await prepareTestDatabase();
      const village = getAnyVillageWithTile(database);

      expect(village.id).not.toBe(village.tileId);

      const targetTileId = database.selectValue({
        sql: `
          SELECT id
          FROM tiles
          WHERE id != $origin_tile_id
          ORDER BY
            (x - (SELECT x FROM tiles WHERE id = $origin_tile_id)) *
            (x - (SELECT x FROM tiles WHERE id = $origin_tile_id)) +
            (y - (SELECT y FROM tiles WHERE id = $origin_tile_id)) *
            (y - (SELECT y FROM tiles WHERE id = $origin_tile_id))
          LIMIT 1;
        `,
        bind: { $origin_tile_id: village.tileId },
        schema: z.number(),
      })!;

      const event = createTroopMovementAttackEventMock({
        villageId: village.id,
        originTileId: village.tileId,
        targetTileId,
        troops: [
          {
            unitId: 'LEGIONNAIRE',
            amount: 10,
            tileId: village.tileId,
            sourceTileId: village.tileId,
          },
        ],
      });

      database.exec({
        sql: `
          DELETE FROM effects
          WHERE effect_id IN (
            SELECT id
            FROM effect_ids
            WHERE effect IN ('unitSpeed', 'unitSpeedAfter20Fields')
          );
        `,
      });

      const durationWithoutBonus = getEventDuration(database, event);

      database.exec({
        sql: `
          INSERT INTO effects (
            effect_id,
            value,
            type_id,
            scope_id,
            source_id,
            tile_id,
            source_specifier
          )
          VALUES (
            (SELECT id FROM effect_ids WHERE effect = 'unitSpeed'),
            2,
            (SELECT id FROM effect_type_ids WHERE type = 'bonus'),
            (SELECT id FROM effect_scope_ids WHERE scope = 'local'),
            (SELECT id FROM effect_source_ids WHERE source = 'hero'),
            $tile_id,
            NULL
          );
        `,
        bind: { $tile_id: village.tileId },
      });

      expect(getEventDuration(database, event)).toBe(durationWithoutBonus / 2);
    });

    test('troopTraining - should heal troops in half the normal training duration', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_training_enabled', 0);
      const villageId = getAnyVillageId(database);

      const normalDuration = getEventDuration(
        database,
        createTroopTrainingEventMock({
          villageId,
          buildingId: 'BARRACKS',
          durationEffectId: 'hospitalTrainingDuration',
          unitId: 'LEGIONNAIRE',
        }),
      );

      const healingDuration = getEventDuration(
        database,
        createTroopTrainingEventMock({
          villageId,
          buildingId: 'HOSPITAL',
          durationEffectId: 'hospitalTrainingDuration',
          unitId: 'LEGIONNAIRE',
        }),
      );

      expect(healingDuration).toBe(normalDuration / 2);
    });

    test('animalCageProduction - should return batch duration based on server speed', async () => {
      const database = await prepareTestDatabase();
      database.exec({
        sql: 'UPDATE servers SET speed = $speed',
        bind: { $speed: 2 },
      });

      const event = createGameEventMock('animalCageProduction', {
        cageAmount: 3,
      });

      expect(getEventDuration(database, event)).toBe(
        (ANIMAL_CAGE_BASE_DURATION * 3) / 2,
      );
    });

    test('trapperCageProduction - should return batch duration based on server speed', async () => {
      const database = await prepareTestDatabase();
      database.exec({
        sql: 'UPDATE servers SET speed = $speed',
        bind: { $speed: 2 },
      });

      const event = createGameEventMock('trapperCageProduction', {
        cageAmount: 3,
      });

      expect(getEventDuration(database, event)).toBe(
        (TRAPPER_CAGE_BASE_DURATION * 3) / 2,
      );
    });

    test('huntersLodgeHunt - should return duration based on party level and server speed', async () => {
      const database = await prepareTestDatabase();
      database.exec({
        sql: 'UPDATE servers SET speed = $speed',
        bind: { $speed: 2 },
      });

      const result = getEventDuration(
        database,
        createGameEventMock('huntersLodgeHunt', {
          huntingPartyLevel: 4,
        }),
      );

      expect(result).toBe((4 * 30 * 60 * 1000) / 2);
    });

    test('huntersLodgeHunt - should return zero duration if instant unit travel enabled', async () => {
      const database = await prepareTestDatabase();
      setDevFlag(database, 'is_instant_unit_travel_enabled', 1);

      const result = getEventDuration(
        database,
        createGameEventMock('huntersLodgeHunt', {
          huntingPartyLevel: 4,
        }),
      );

      expect(result).toBe(0);
    });

    test('heroRevival - should apply server speed and return correct duration', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const { experience, speed } = database.selectObject({
        sql: `
          SELECT h.experience, s.speed
          FROM
            heroes h
              JOIN servers s ON 1 = 1
          WHERE
            h.player_id = $player_id;
        `,
        bind: { $player_id: PLAYER_ID },
        schema: z.strictObject({
          experience: z.number(),
          speed: z.number(),
        }),
      })!;

      const { level } = calculateHeroLevel(experience);
      const expectedDuration = calculateHeroRevivalTime(level) / speed;

      const result = getEventDuration(
        database,
        createHeroRevivalEventMock({
          villageId,
        }),
      );

      expect(result).toBe(expectedDuration);
    });

    test('heroRevival - should return zero duration if instant hero revival enabled', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      setDevFlag(database, 'is_instant_hero_revive_enabled', 1);

      const result = getEventDuration(
        database,
        createHeroRevivalEventMock({
          villageId,
        }),
      );

      expect(result).toBe(0);
    });

    test('heroHealthRegeneration - should return correct duration', async () => {
      const database = await prepareTestDatabase();

      database.exec({
        sql: 'UPDATE heroes SET health_regeneration = 25 WHERE player_id = $player_id',
        bind: { $player_id: PLAYER_ID },
      });

      const result = getEventDuration(
        database,
        createHeroHealthRegenerationEventMock(),
      );

      const dayInMs = 24 * 60 * 60 * 1000;
      expect(result).toBe(dayInMs / 25);
    });
  });

  describe(createEvents, () => {
    test('should reject incomplete event payloads before persistence', async () => {
      const database = await prepareTestDatabase();

      expect(() =>
        createEvents(database, {
          type: 'gatherersHutGatheringTrip',
          villageId: 1,
          troops: [{ unitId: 'PHALANX', amount: 1, sourceTileId: 1 }],
        } as never),
      ).toThrow();

      const eventCount = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM events
          WHERE type = 'gatherersHutGatheringTrip';
        `,
        schema: z.number(),
      });

      expect(eventCount).toBe(0);
    });

    test('troopTraining - should complete queued troop count quests when units are queued', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const now = 1_234_000;

      vi.useFakeTimers();
      vi.setSystemTime(now);

      setDevFlag(database, 'is_free_unit_training_enabled', 1);
      setDevFlag(database, 'is_instant_unit_training_enabled', 1);

      database.exec({
        sql: `
          INSERT INTO building_fields (village_id, field_id, building_id, level)
          VALUES (
            $village_id,
            19,
            (SELECT id FROM building_ids WHERE building = 'BARRACKS'),
            1
          )
          ON CONFLICT(village_id, field_id) DO UPDATE SET
            building_id = excluded.building_id,
            level = excluded.level;
        `,
        bind: {
          $village_id: villageId,
        },
      });

      const initialQuest = database.selectValue({
        sql: "SELECT completed_at FROM quests WHERE quest_id = 'queuedTroopCount-10';",
        schema: z.number().nullable(),
      })!;

      expect(initialQuest).toBe(null);

      const initialUnitQuest = database.selectValue({
        sql: "SELECT completed_at FROM quests WHERE quest_id = 'queuedTroopCountById-PHALANX-10';",
        schema: z.number().nullable(),
      })!;

      expect(initialUnitQuest).toBe(null);

      createEvents<'troopTraining'>(database, {
        type: 'troopTraining',
        villageId,
        unitId: 'PHALANX',
        amount: 10,
        buildingId: 'BARRACKS',
        batchId: 'queued-quest-test',
        durationEffectId: 'barracksTrainingDuration',
      });

      const completedQuest = database.selectValue({
        sql: "SELECT completed_at FROM quests WHERE quest_id = 'queuedTroopCount-10';",
        schema: z.number().nullable(),
      })!;

      expect(completedQuest).toBe(now);

      const completedUnitQuest = database.selectValue({
        sql: "SELECT completed_at FROM quests WHERE quest_id = 'queuedTroopCountById-PHALANX-10';",
        schema: z.number().nullable(),
      })!;

      expect(completedUnitQuest).toBe(now);

      const otherUnitQuest = database.selectValue({
        sql: "SELECT completed_at FROM quests WHERE quest_id = 'queuedTroopCountById-SWORDSMAN-10';",
        schema: z.number().nullable(),
      })!;

      expect(otherUnitQuest).toBe(null);

      vi.useRealTimers();
    });

    test('huntersLodgeHunt - should subtract resources and persist calculated duration', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const now = 1_000_000;
      vi.useFakeTimers();
      vi.setSystemTime(now);
      setHuntersLodgeLevel(database, villageId, 3);

      database.exec({
        sql: `
          UPDATE resource_sites
          SET
            wood = 700,
            clay = 700,
            iron = 700,
            wheat = 700,
            updated_at = $now
          WHERE
            tile_id = (
              SELECT tile_id
              FROM
                villages
              WHERE
                id = $village_id
            );
        `,
        bind: {
          $village_id: villageId,
          $now: now,
        },
      });

      createEvents<'huntersLodgeHunt'>(database, {
        type: 'huntersLodgeHunt',
        villageId,
        huntingPartyLevel: 2,
      });

      const event = database.selectObject({
        sql: `
          SELECT
            duration,
            JSON_EXTRACT(meta, '$.huntingPartyLevel') AS huntingPartyLevel
          FROM
            events
          WHERE
            village_id = $village_id
            AND type = 'huntersLodgeHunt';
        `,
        bind: {
          $village_id: villageId,
        },
        schema: z.strictObject({
          duration: z.number(),
          huntingPartyLevel: z.number(),
        }),
      })!;

      const resources = database.selectObject({
        sql: `
          SELECT
            wood,
            clay,
            iron,
            wheat
          FROM
            resource_sites
          WHERE
            tile_id = (
              SELECT tile_id
              FROM
                villages
              WHERE
                id = $village_id
            );
        `,
        bind: {
          $village_id: villageId,
        },
        schema: resourcesSchema,
      })!;

      expect(event).toStrictEqual({
        duration: 60 * 60 * 1000,
        huntingPartyLevel: 2,
      });

      expect(resources).toStrictEqual({
        wood: 700,
        clay: 700,
        iron: 700,
        wheat: 500,
      });

      vi.useRealTimers();
    });
  });

  describe(getEventStartTime, () => {
    test('troopTraining - should return now if no previous events', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      vi.useFakeTimers();
      const now = 1_234_567_890;
      vi.setSystemTime(new Date(now));

      const event = createTroopTrainingEventMock({
        villageId,
      });

      expect(getEventStartTime(database, event)).toBe(now);
      vi.useRealTimers();
    });

    test('troopTraining - should return end of last event in queue', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const startsAt = 1000;
      const duration = 500;
      insertEvents(database, [
        createTroopTrainingEventMock({
          id: 77_001,
          villageId,
          startsAt,
          duration,
        }),
      ]);

      const newEvent = createTroopTrainingEventMock({
        villageId,
        batchId: 'b2',
      });

      expect(getEventStartTime(database, newEvent)).toBe(1500);
    });

    test('unitImprovement - should return last resolves_at or now', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const startsAt = 2000;
      const duration = 500;
      insertEvents(database, [
        createUnitImprovementEventMock({
          id: 88_001,
          villageId,
          startsAt,
          duration,
        }),
      ]);

      const startTime = getEventStartTime(
        database,
        createUnitImprovementEventMock(),
      );

      expect(startTime).toBe(2500);
    });

    test('returnTroopMovement - should return now for manually triggered return', async () => {
      const database = await prepareTestDatabase();

      vi.useFakeTimers();
      const now = 5_000;
      vi.setSystemTime(new Date(now));

      const event = createGameEventMock('troopMovementReturn', {
        originalMovementType: 'troopMovementReturnReinforcements',
        startsAt: 2000,
        duration: 1000,
      });

      expect(getEventStartTime(database, event)).toBe(now);

      vi.useRealTimers();
    });

    test('returnTroopMovement - should return resolvesAt for movement-triggered return', async () => {
      const database = await prepareTestDatabase();

      const event = createGameEventMock('troopMovementReturn', {
        startsAt: 2000,
        duration: 1000,
        resolvesAt: 3000,
        originalMovementType: 'troopMovementAttack',
      });

      expect(getEventStartTime(database, event)).toBe(3000);
    });

    test('buildingConstruction - should return now', async () => {
      const database = await prepareTestDatabase();
      vi.useFakeTimers();
      const now = 9_999_999;
      vi.setSystemTime(new Date(now));
      const result = getEventStartTime(
        database,
        createBuildingConstructionEventMock(),
      );
      expect(result).toBe(now);
      vi.useRealTimers();
    });
  });

  describe(getEventResourceSubtractionTimestamp, () => {
    test('should return now even if the event starts in the future (repro for incorrect resource subtraction)', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      vi.useFakeTimers();
      const now = 1_000_000;
      vi.setSystemTime(new Date(now));

      // 1. Setup village with enough resources
      database.exec({
        sql: `
          UPDATE resource_sites
          SET wood = 1000000, clay = 1000000, iron = 1000000, wheat = 1000000, updated_at = $now
          WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
        `,
        bind: { $village_id: villageId, $now: now },
      });

      // 2. Mock a training event that starts far in the future
      const unitId = 'LEGIONNAIRE';
      // We need a Barracks
      database.exec({
        sql: `
          UPDATE building_fields
          SET building_id = (SELECT id FROM building_ids WHERE building = 'BARRACKS'), level = 1
          WHERE village_id = $village_id
        `,
        bind: { $village_id: villageId },
      });
      database.exec({
        sql: `INSERT OR IGNORE INTO unit_research (village_id, unit_id)
              VALUES ($village_id, (SELECT id FROM unit_ids WHERE unit = $unit))`,
        bind: { $village_id: villageId, $unit: unitId },
      });

      const futureStartsAt = now + 1_000_000;
      const trainingEvent = createTroopTrainingEventMock({
        villageId,
        unitId,
        amount: 1,
        buildingId: 'BARRACKS',
        startsAt: futureStartsAt, // This might be overridden by createEvents but we'll try
      });

      // Instead of relying on createEvents to pick up our startsAt (it won't),
      // we'll directly test getEventResourceSubtractionTimestamp with a future startsAt.
      const resultTimestamp = getEventResourceSubtractionTimestamp(
        database,
        trainingEvent,
        futureStartsAt,
      );

      // It MUST return 'now', not 'futureStartsAt'
      expect(resultTimestamp).toBe(now);

      vi.useRealTimers();
    });
  });
});
