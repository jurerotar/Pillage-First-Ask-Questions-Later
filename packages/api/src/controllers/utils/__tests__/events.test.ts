import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import {
  calculateHeroLevel,
  calculateHeroRevivalCost,
  calculateHeroRevivalTime,
} from '@pillage-first/game-assets/utils/hero';
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
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { Unit } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
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

const setDevFlag = (database: DbFacade, column: string, value: number) => {
  database.exec({
    sql: `UPDATE developer_settings SET ${column} = $value`,
    bind: { $value: value },
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
          startsAt,
          duration,
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitResearchEventMock({
            villageId,
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
        bind: { $village_id: villageId, $unit: 'LEGIONNAIRE' },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitResearchEventMock({
            villageId,
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
        bind: { $village_id: villageId, $unit: 'LEGIONNAIRE' },
      });

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createUnitResearchEventMock({
            villageId,
          }),
        ),
      ).not.toThrow();
    });

    test('troopTraining - should throw if unit is not researched', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const event = createTroopTrainingEventMock({
        villageId,
        unitId: 'IMPERIAN',
      });

      expect(() => validateEventCreationPrerequisites(database, event)).toThrow(
        'Unit is not researched',
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
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId: 19, // village building
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
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId: 19, // village building
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
        }),
      ]);

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId: 2, // another resource field
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

    test('isBuildingDestructionEvent - should throw if building destruction is already in progress', async () => {
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
          createBuildingDestructionEventMock({
            villageId,
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
            targetCoordinates: { x: 1, y: 1 },
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
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
            targetCoordinates: { x: 1, y: 1 },
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
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
            targetCoordinates: { x: 1, y: 1 },
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
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
            targetCoordinates: { x: 2, y: 2 },
          }),
        ),
      ).toThrow('Target must be a village or an oasis');
    });

    test('troopMovementAttack - should not throw if target is village', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const { x, y } = database.selectObject({
        sql: 'SELECT x, y FROM tiles WHERE id = (SELECT tile_id FROM villages WHERE id = $id)',
        bind: { $id: villageId },
        schema: z.object({ x: z.number(), y: z.number() }),
      })!;

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementAttackEventMock({ targetCoordinates: { x, y } }),
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
            targetCoordinates: { x: 2, y: 2 },
          }),
        ),
      ).toThrow('Target must be a village or an oasis');
    });

    test('troopMovementFindNewVillage - should throw if target is occupied', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const { x, y } = database.selectObject({
        sql: 'SELECT x, y FROM tiles WHERE id = (SELECT tile_id FROM villages WHERE id = $id)',
        bind: { $id: villageId },
        schema: z.object({ x: z.number(), y: z.number() }),
      })!;

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementFindNewVillageEventMock({
            targetCoordinates: { x, y },
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
            targetCoordinates: { x: 2, y: 2 },
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
          }),
        ),
      ).toThrow('Target must be an oasis');
    });

    test('troopMovementOasisOccupation - should throw if already occupied by you', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const { x, y } = database.selectObject({
        sql: `
          SELECT t.x, t.y
          FROM tiles t
          JOIN oasis o ON o.tile_id = t.id
          LIMIT 1
        `,
        schema: z.object({ x: z.number(), y: z.number() }),
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
            targetCoordinates: { x, y },
          }),
        ),
      ).toThrow('Oasis is already occupied by you');
    });

    test('troopMovementRelocation - should throw if target is not your own village', async () => {
      const database = await prepareTestDatabase();

      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createTroopMovementRelocationEventMock({
            targetCoordinates: { x: 2, y: 2 },
          }),
        ),
      ).toThrow(
        'Reinforcements and relocations can only be sent to your own villages',
      );
    });

    test('other events - should not throw by default', async () => {
      const database = await prepareTestDatabase();
      expect(() =>
        validateEventCreationPrerequisites(
          database,
          createGameEventMock('troopMovementAttack', {
            targetCoordinates: { x: 1, y: 1 },
            troops: [
              { unitId: 'LEGIONNAIRE', amount: 1, tileId: 1, source: 1 },
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
            source: villageTileId,
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
              source: villageTileId,
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
              source: villageTileId,
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

    test('scheduledBuildingEvent - should return resolvesAt from database', async () => {
      const database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const startsAt = 3000;
      const duration = 400;
      insertEvents(database, [
        createBuildingLevelChangeEventMock({
          id: 66_001,
          villageId,
          startsAt,
          duration,
        }),
      ]);

      const startTime = getEventStartTime(
        database,
        createGameEventMock('buildingScheduledConstruction', {
          villageId,
          level: 2,
          previousLevel: 1,
        }),
      );

      expect(startTime).toBe(3400);
    });

    test('returnTroopMovement - should return startsAt + duration', async () => {
      const database = await prepareTestDatabase();
      const event = createGameEventMock('troopMovementReturn', {
        startsAt: 2000,
        duration: 1000,
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
