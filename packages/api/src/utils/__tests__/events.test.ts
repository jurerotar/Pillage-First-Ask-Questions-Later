import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import {
  createTestVillage,
  prepareTestDatabase,
  setTestBuildingLevel,
  setTestDeveloperSetting,
  setTestWoundedTroopAmount,
} from '@pillage-first/api/testing';
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
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import {
  createAnimalCageProductionEventMock,
  createBuildingConstructionEventMock,
  createBuildingDestructionEventMock,
  createBuildingLevelChangeEventMock,
  createGameEventMock,
  createHeroRevivalEventMock,
  createHuntersLodgeHuntEventMock,
  createResourceTransferEventMock,
  createTrapperCageProductionEventMock,
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
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { Unit } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectResourceSiteResourcesRelevantEffectsByTileIdQuery } from '../../queries/effect-queries';
import { selectVillageMerchantStatsByVillageIdQuery } from '../../queries/marketplace-queries';
import { createEvents } from '../create-event';
import { insertEvents } from '../insert-events';
import { calculateResourceSiteResourcesAt } from '../village';
import { getCreationRules, insertTestEvents } from './event-resolver-helpers';

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
    schema: tileIdSchema,
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
      tileId: tileIdSchema,
    }),
  })!;
};

describe('events utils', () => {
  describe('creation validation', () => {
    test.each([
      ['valid', undefined],
      [
        'missing source',
        'Target village does not exist or does not belong to player',
      ],
      ['missing target', 'Merchant return must target the source village'],
      ['foreign target', 'Merchant return must target the source village'],
      ['wrong tile', 'Merchant return target tile must be source village'],
      ['different source', 'Merchant return must target the source village'],
    ] as const)(
      'resourceTransfer - validates a %s return without merchant stats or writes',
      async (scenario, error) => {
        using database = await prepareTestDatabase();

        const source = getAnyVillageWithTile(database);

        const event = createResourceTransferEventMock({
          villageId: source.id,
          targetVillageId: source.id,
          targetTileId: source.tileId,
          resources: { wood: 0, clay: 0, iron: 0, wheat: 0 },
          merchantAmount: 1,
        });

        if (scenario === 'missing source') {
          event.villageId = -1;
          event.targetVillageId = -1;
        } else if (scenario === 'missing target') {
          event.targetVillageId = -1;
        } else if (
          scenario === 'foreign target' ||
          scenario === 'different source'
        ) {
          const playerId =
            scenario === 'foreign target'
              ? database.selectValue({
                  sql: 'SELECT id FROM players WHERE id != $player_id LIMIT 1;',
                  bind: { $player_id: PLAYER_ID },
                  schema: z.number(),
                })!
              : PLAYER_ID;

          const target = createTestVillage(
            database,
            'Return validation target',
            { playerId },
          );

          event.targetVillageId = target.id;
          event.targetTileId = target.tileId;
        } else if (scenario === 'wrong tile') {
          event.targetTileId = source.tileId + 1;
        }

        database.exec({ sql: 'PRAGMA query_only = ON;' });

        using selectObject = vi.spyOn(database, 'selectObject');

        const validate = () =>
          getCreationRules(database, event).validate(Date.now());

        if (error) {
          expect(validate).toThrow(error);
        } else {
          expect(validate).not.toThrow();
        }

        expect(selectObject).toHaveBeenCalledTimes(
          event.targetVillageId === event.villageId ? 1 : 0,
        );

        expect(selectObject).not.toHaveBeenCalledWith(
          expect.objectContaining({
            sql: selectVillageMerchantStatsByVillageIdQuery,
          }),
        );
      },
    );

    test('unitImprovement - should throw if smithy is busy', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createUnitImprovementEventMock({
            villageId,
          }),
        ).validate(Date.now()),
      ).toThrow('Smithy is busy');
    });

    test('unitImprovement - should return true if smithy is idle', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createUnitImprovementEventMock({
            villageId,
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('unitImprovement - should throw if target level exceeds 20', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      expect(() =>
        createEvents<'unitImprovement'>(database, {
          type: 'unitImprovement',
          villageId,
          unitId: 'PHALANX',
          level: 21,
        }),
      ).toThrow(z.ZodError);
    });

    test('unitImprovement - should throw if smithy level is lower than requested upgrade level', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createUnitImprovementEventMock({
            villageId,
            level: 2,
          }),
        ).validate(Date.now()),
      ).toThrow('Smithy level is too low for this unit upgrade');
    });

    test('unitResearch - should throw if academy is busy', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'PHALANX',
          }),
        ).validate(Date.now()),
      ).toThrow('Academy is busy');
    });

    test('unitResearch - should throw if unit is already researched', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          INSERT INTO unit_research (village_id, unit_id)
          VALUES
            ($village_id, (SELECT id FROM unit_ids WHERE unit = $unit))
        `,
        bind: { $village_id: villageId, $unit: 'PHALANX' },
      });

      expect(() =>
        getCreationRules(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'PHALANX',
          }),
        ).validate(Date.now()),
      ).toThrow('Unit is already researched');
    });

    test('unitResearch - should not throw if academy idle and unit not researched', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: `
          DELETE FROM unit_research
          WHERE
            village_id = $village_id
            AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit)
        `,
        bind: { $village_id: villageId, $unit: 'PHALANX' },
      });

      expect(() =>
        getCreationRules(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'PHALANX',
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('unitResearch - should throw if unit does not belong to village tribe', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      expect(() =>
        getCreationRules(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'LEGIONNAIRE',
          }),
        ).validate(Date.now()),
      ).toThrow('Unit does not belong to village tribe');
    });

    test('unitResearch - should throw if research building requirements are missing', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestBuildingLevel(database, villageId, 'ACADEMY', 2);

      expect(() =>
        getCreationRules(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'SWORDSMAN',
          }),
        ).validate(Date.now()),
      ).toThrow('Unit research requirements are not met');
    });

    test('unitResearch - should not throw if research building requirements are met', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestBuildingLevel(database, villageId, 'ACADEMY', 3);

      expect(() =>
        getCreationRules(
          database,
          createUnitResearchEventMock({
            villageId,
            unitId: 'SWORDSMAN',
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('troopTraining - should throw if unit does not belong to village tribe', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const event = createTroopTrainingEventMock({
        villageId,
        unitId: 'LEGIONNAIRE',
      });

      expect(() =>
        getCreationRules(database, event).validate(Date.now()),
      ).toThrow('Unit does not belong to village tribe');
    });

    test('troopTraining - should throw if unit is not researched', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const event = createTroopTrainingEventMock({
        villageId,
        unitId: 'SWORDSMAN',
      });

      expect(() =>
        getCreationRules(database, event).validate(Date.now()),
      ).toThrow('Unit is not researched');
    });

    test('troopTraining - should throw if training building does not match unit category', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestBuildingLevel(database, villageId, 'STABLE', 1);

      const event = createTroopTrainingEventMock({
        villageId,
        unitId: 'PHALANX',
        buildingId: 'STABLE',
        durationEffectId: 'stableTrainingDuration',
      });

      expect(() =>
        getCreationRules(database, event).validate(Date.now()),
      ).toThrow('Unit training building does not match unit category');
    });

    test('troopTraining - should throw if duration effect does not match training building', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestBuildingLevel(database, villageId, 'BARRACKS', 1);

      const event = createTroopTrainingEventMock({
        villageId,
        unitId: 'PHALANX',
        buildingId: 'BARRACKS',
        durationEffectId: 'stableTrainingDuration',
      });

      expect(() =>
        getCreationRules(database, event).validate(Date.now()),
      ).toThrow('Unit training duration effect does not match building');
    });

    test('troopTraining - should throw if recruitment building requirements are missing', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestBuildingLevel(database, villageId, 'RESIDENCE', 9);

      const event = createTroopTrainingEventMock({
        villageId,
        unitId: 'GAUL_SETTLER',
        buildingId: 'RESIDENCE',
        durationEffectId: 'residenceTrainingDuration',
      });

      expect(() =>
        getCreationRules(database, event).validate(Date.now()),
      ).toThrow('Unit recruitment requirements are not met');
    });

    test('troopTraining - should throw if healing unit is not researched', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestBuildingLevel(database, villageId, 'HOSPITAL', 10);
      setTestWoundedTroopAmount(
        database,
        villageId,
        'SWORDSMAN',
        5,
        Date.now() + 60_000,
      );

      const event = createTroopTrainingEventMock({
        villageId,
        buildingId: 'HOSPITAL',
        durationEffectId: 'hospitalTrainingDuration',
        unitId: 'SWORDSMAN',
        amount: 5,
      });

      expect(() =>
        getCreationRules(database, event).validate(Date.now()),
      ).toThrow('Unit is not researched');
    });

    test('troopTraining - should throw if healing more troops than are wounded', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestBuildingLevel(database, villageId, 'HOSPITAL', 10);
      setTestWoundedTroopAmount(
        database,
        villageId,
        'PHALANX',
        4,
        Date.now() + 60_000,
      );

      const event = createTroopTrainingEventMock({
        villageId,
        buildingId: 'HOSPITAL',
        durationEffectId: 'hospitalTrainingDuration',
        unitId: 'PHALANX',
        amount: 5,
      });

      expect(() =>
        getCreationRules(database, event).validate(Date.now()),
      ).toThrow('Not enough wounded troops available');
    });

    test('buildingLevelChange - should throw if target level exceeds max level', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const { maxLevel } = getBuildingDefinition('MAIN_BUILDING');

      expect(() =>
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingId: 'MAIN_BUILDING',
            level: maxLevel + 1,
          }),
        ).validate(Date.now()),
      ).toThrow('Building level cannot exceed max level');
    });

    test('buildingConstruction - should throw if target level exceeds max level', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const { maxLevel } = getBuildingDefinition('MAIN_BUILDING');

      expect(() =>
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingId: 'MAIN_BUILDING',
            level: maxLevel + 1,
          }),
        ).validate(Date.now()),
      ).toThrow('Building level cannot exceed max level');
    });

    test('buildingConstruction - should throw if building field is already occupied', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId: occupiedBuildingFieldId,
          }),
        ).validate(Date.now()),
      ).toThrow('Building field is already occupied');
    });

    test('buildingConstruction - should not throw if building field is not occupied', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId,
            buildingId: 'WAREHOUSE',
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('buildingConstruction - should throw if building requirements are missing', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const buildingFieldId = 25;

      database.execMulti({
        sql: `
          DELETE FROM effects
          WHERE
            tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
            AND source_specifier = $field_id;
          DELETE FROM building_fields
          WHERE
            village_id = $village_id
            AND field_id = $field_id;
        `,
        bind: {
          $village_id: villageId,
          $field_id: buildingFieldId,
        },
      });

      expect(() =>
        getCreationRules(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId,
            buildingId: 'BARRACKS',
          }),
        ).validate(Date.now()),
      ).toThrow('Building requirements are not met');
    });

    test('buildingLevelChange - should not check construction requirements for level ups', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingFieldId,
            buildingId: 'BARRACKS',
            previousLevel: 1,
            level: 2,
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('buildingLevelChange - does not require positive wheat production', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const buildingFieldId = database.selectValue({
        sql: `
          SELECT bf.field_id
          FROM
            building_fields bf
              JOIN building_ids bi ON bi.id = bf.building_id
          WHERE
            bf.village_id = $village_id
            AND bi.building = 'WHEAT_FIELD'
          LIMIT 1;
        `,
        bind: { $village_id: villageId },
        schema: z.number(),
      })!;

      database.exec({
        sql: `
          UPDATE effects
          SET value = -100000
          WHERE
            tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
            AND effect_id = (
              SELECT id FROM effect_ids WHERE effect = 'wheatProduction'
            )
            AND source_id = (
              SELECT id FROM effect_source_ids WHERE source = 'building'
            )
            AND source_specifier = 0;
        `,
        bind: { $village_id: villageId },
      });

      expect(() =>
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingFieldId,
            buildingId: 'WHEAT_FIELD',
            previousLevel: 5,
            level: 6,
          }),
        ).validate(Date.now()),
      ).not.toThrow();
      expect(() =>
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({ villageId }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('troopMovementAdventure - should throw if no adventure points are available', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createTroopMovementAdventureEventMock({ villageId }),
        ).validate(Date.now()),
      ).toThrow('No adventure points available');
    });

    test("huntersLodgeHunt - should throw if party level exceeds Hunter's Lodge level", async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestBuildingLevel(database, villageId, 'HUNTERS_LODGE', 2);

      expect(() =>
        getCreationRules(
          database,
          createHuntersLodgeHuntEventMock({
            villageId,
            huntingPartyLevel: 3,
          }),
        ).validate(Date.now()),
      ).toThrow("Hunter's Lodge level is too low");
    });

    test("huntersLodgeHunt - should throw if Hunter's Lodge is already hunting", async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestBuildingLevel(database, villageId, 'HUNTERS_LODGE', 2);

      insertEvents(database, [
        createHuntersLodgeHuntEventMock({
          villageId,
          huntingPartyLevel: 1,
        }),
      ]);

      expect(() =>
        getCreationRules(
          database,
          createHuntersLodgeHuntEventMock({
            villageId,
            huntingPartyLevel: 1,
          }),
        ).validate(Date.now()),
      ).toThrow("Hunter's Lodge is busy");
    });

    test('isBuildingEvent - non-Romans should throw if building queue is full', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId: 19, // village building
            buildingId: 'WAREHOUSE',
          }),
        ).validate(Date.now()),
      ).toThrow('Building construction queue is full');
    });

    test('isBuildingEvent - Romans should not throw if one resource and one village building are in queue', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId: 19, // village building
            buildingId: 'WAREHOUSE',
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('isBuildingEvent - Romans should throw if two resource field events are in queue', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingConstructionEventMock({
            villageId,
            buildingFieldId: 2, // another resource field
            buildingId: 'WHEAT_FIELD',
          }),
        ).validate(Date.now()),
      ).toThrow('Building construction queue is full');
    });

    test('isBuildingEvent - Romans should throw if two village building events are in queue', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingFieldId: 20, // another village building
          }),
        ).validate(Date.now()),
      ).toThrow('Building construction queue is full');
    });

    test('isBuildingEvent - should not throw if only downgrade event is in queue', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingFieldId: 20,
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('isBuildingEvent - should not throw if only buildingDestruction event is in queue', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      insertEvents(database, [
        createBuildingDestructionEventMock({
          villageId,
        }),
      ]);

      expect(() =>
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            buildingFieldId: 20,
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('isBuildingDowngradeEvent - should throw if main building level is lower than 10', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            previousLevel: 2,
            level: 1,
          }),
        ).validate(Date.now()),
      ).toThrow('Main building level 10 is required to downgrade buildings');
    });

    test('isBuildingDowngradeEvent - should not throw if main building level is at least 10', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            previousLevel: 2,
            level: 1,
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('isBuildingDowngradeEvent - should throw if another downgrade event is already in queue', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            previousLevel: 3,
            level: 2,
          }),
        ).validate(Date.now()),
      ).toThrow('Main building is busy');
    });

    test('isBuildingDowngradeEvent - should throw if a building destruction event is already in queue', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingLevelChangeEventMock({
            villageId,
            previousLevel: 2,
            level: 1,
          }),
        ).validate(Date.now()),
      ).toThrow('Main building is busy');
    });

    test('isBuildingDestructionEvent - should throw if a building downgrade event is already in queue', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingDestructionEventMock({
            villageId,
          }),
        ).validate(Date.now()),
      ).toThrow('Main building is busy');
    });

    test('isBuildingDestructionEvent - should throw if building destruction is already in progress', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createBuildingDestructionEventMock({
            villageId,
            previousLevel: 9,
            level: 0,
          }),
        ).validate(Date.now()),
      ).toThrow('Main building is busy');
    });

    test('troopMovementAdventure - should not throw if adventure points are available', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createTroopMovementAdventureEventMock({ villageId }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('troopMovementAdventure - should throw if hero is reinforcing another village', async () => {
      using database = await prepareTestDatabase();

      const homeVillage = database.selectObject({
        sql: `
          SELECT id, tile_id
          FROM villages
          WHERE player_id = $player_id
          ORDER BY id
          LIMIT 1;
        `,
        bind: { $player_id: PLAYER_ID },
        schema: z.strictObject({ id: z.number(), tile_id: tileIdSchema }),
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
        schema: z.strictObject({ id: z.number(), tile_id: tileIdSchema }),
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
        getCreationRules(
          database,
          createTroopMovementAdventureEventMock({ villageId: homeVillage.id }),
        ).validate(Date.now()),
      ).toThrow('Hero is not stationed in his home village');
    });

    test('troopMovementOasisOccupation - should throw if no free oasis occupation slots', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: 'UPDATE oasis SET village_id = null WHERE village_id = $village_id;',
        bind: { $village_id: villageId },
      });

      expect(() =>
        getCreationRules(
          database,
          createGameEventMock('troopMovementOasisOccupation', {
            villageId,
            targetTileId: getTileIdByCoordinates(database, { x: 1, y: 1 }),
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, sourceTileId: 1 }],
          }),
        ).validate(Date.now()),
      ).toThrow('No free oasis occupation slots available');
    });

    test('troopMovementOasisOccupation - should not throw if free oasis occupation slot exists', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createGameEventMock('troopMovementOasisOccupation', {
            villageId,
            targetTileId: getTileIdByCoordinates(database, { x: 1, y: 1 }),
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, sourceTileId: 1 }],
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('troopMovementOasisOccupation - should throw if all slots are already used', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createGameEventMock('troopMovementOasisOccupation', {
            villageId,
            targetTileId: getTileIdByCoordinates(database, { x: 1, y: 1 }),
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, sourceTileId: 1 }],
          }),
        ).validate(Date.now()),
      ).toThrow('No free oasis occupation slots available');
    });

    test('troopMovementAttack - should throw if target is not village or oasis', async () => {
      using database = await prepareTestDatabase();

      database.exec({
        sql: 'DELETE FROM villages WHERE tile_id = (SELECT id FROM tiles WHERE x = 2 AND y = 2)',
      });

      database.exec({
        sql: 'DELETE FROM oasis WHERE tile_id = (SELECT id FROM tiles WHERE x = 2 AND y = 2)',
      });

      expect(() =>
        getCreationRules(
          database,
          createTroopMovementAttackEventMock({
            targetTileId: getTileIdByCoordinates(database, { x: 2, y: 2 }),
          }),
        ).validate(Date.now()),
      ).toThrow('Target must be a village or an oasis');
    });

    test('troopMovementAttack - should not throw if target is village', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const targetTileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $id',
        bind: { $id: villageId },
        schema: tileIdSchema,
      })!;

      expect(() =>
        getCreationRules(
          database,
          createTroopMovementAttackEventMock({ targetTileId }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('troopMovementAttack - should not throw if target is oasis', async () => {
      using database = await prepareTestDatabase();
      const targetTileId = database.selectValue({
        sql: 'SELECT tile_id FROM oasis LIMIT 1',
        schema: z.number(),
      })!;

      expect(() =>
        getCreationRules(
          database,
          createTroopMovementAttackEventMock({ targetTileId }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('troopMovementRaid - should throw if target is not village or oasis', async () => {
      using database = await prepareTestDatabase();

      database.exec({
        sql: 'DELETE FROM villages WHERE tile_id = (SELECT id FROM tiles WHERE x = 2 AND y = 2)',
      });

      database.exec({
        sql: 'DELETE FROM oasis WHERE tile_id = (SELECT id FROM tiles WHERE x = 2 AND y = 2)',
      });

      expect(() =>
        getCreationRules(
          database,
          createTroopMovementRaidEventMock({
            targetTileId: getTileIdByCoordinates(database, { x: 2, y: 2 }),
          }),
        ).validate(Date.now()),
      ).toThrow('Target must be a village or an oasis');
    });

    test('troopMovementRaid - should not throw if target is oasis', async () => {
      using database = await prepareTestDatabase();
      const targetTileId = database.selectValue({
        sql: 'SELECT tile_id FROM oasis LIMIT 1',
        schema: z.number(),
      })!;

      expect(() =>
        getCreationRules(
          database,
          createTroopMovementRaidEventMock({ targetTileId }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('troopMovementFindNewVillage - should throw if target is occupied', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const targetTileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $id',
        bind: { $id: villageId },
        schema: tileIdSchema,
      })!;

      expect(() =>
        getCreationRules(
          database,
          createTroopMovementFindNewVillageEventMock({
            targetTileId,
            troops: [
              {
                unitId: 'ROMAN_SETTLER',
                amount: 3,
                tileId: 1,
                sourceTileId: 1,
              },
            ],
          }),
        ).validate(Date.now()),
      ).toThrow('Target tile must be unoccupied');
    });

    test('troopMovementOasisOccupation - should throw if target is not oasis', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createGameEventMock('troopMovementOasisOccupation', {
            villageId,
            targetTileId: getTileIdByCoordinates(database, { x: 2, y: 2 }),
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, sourceTileId: 1 }],
          }),
        ).validate(Date.now()),
      ).toThrow('Target must be an oasis');
    });

    test('troopMovementOasisOccupation - should throw if already occupied by you', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const { targetTileId, x, y } = database.selectObject({
        sql: `
          SELECT t.id AS targetTileId, t.x, t.y
          FROM tiles t
          JOIN oasis o ON o.tile_id = t.id
          LIMIT 1
        `,
        schema: z.strictObject({
          targetTileId: tileIdSchema,
          x: z.number(),
          y: z.number(),
        }),
      })!;

      database.exec({
        sql: `
          UPDATE oasis
          SET
            village_id = $villageId
          WHERE
            tile_id = (SELECT id FROM tiles WHERE x = $x AND y = $y)
        `,
        bind: { $villageId: villageId, $x: x, $y: y },
      });

      expect(() =>
        getCreationRules(
          database,
          createGameEventMock('troopMovementOasisOccupation', {
            villageId,
            targetTileId,
            troops: [{ unitId: 'HERO', amount: 1, tileId: 1, sourceTileId: 1 }],
          }),
        ).validate(Date.now()),
      ).toThrow('Oasis is already occupied by you');
    });

    test('troopMovementRelocation - should throw if target tile does not exist', async () => {
      using database = await prepareTestDatabase();

      expect(() =>
        getCreationRules(
          database,
          createTroopMovementRelocationEventMock({
            targetTileId: getTileIdByCoordinates(database, { x: 2, y: 2 }),
          }),
        ).validate(Date.now()),
      ).toThrow('Target tile does not exist');
    });

    test('troopMovementRelocation - should throw if target tile is an occupied oasis', async () => {
      using database = await prepareTestDatabase();
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
        getCreationRules(
          database,
          createTroopMovementRelocationEventMock({
            villageId,
            targetTileId,
          }),
        ).validate(Date.now()),
      ).toThrow('Troops can not be relocated to oasis');
    });

    test('return troop movements - should not throw by default', async () => {
      using database = await prepareTestDatabase();

      expect(() =>
        getCreationRules(
          database,
          createGameEventMock('troopMovementReturn', {
            targetTileId: getTileIdByCoordinates(database, { x: 1, y: 1 }),
            originalMovementType: 'troopMovementReturnReinforcements',
            troops: [
              { unitId: 'LEGIONNAIRE', amount: 1, tileId: 1, sourceTileId: 1 },
            ],
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });

    test('heroRevival - should throw if hero is already alive', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: 'UPDATE heroes SET health = 100 WHERE player_id = $player_id',
        bind: { $player_id: PLAYER_ID },
      });

      expect(() =>
        getCreationRules(
          database,
          createHeroRevivalEventMock({
            villageId,
          }),
        ).validate(Date.now()),
      ).toThrow('Hero is already alive');
    });

    test('heroRevival - should not throw if hero is dead', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      database.exec({
        sql: 'UPDATE heroes SET health = 0 WHERE player_id = $player_id',
        bind: { $player_id: PLAYER_ID },
      });

      expect(() =>
        getCreationRules(
          database,
          createHeroRevivalEventMock({
            villageId,
          }),
        ).validate(Date.now()),
      ).not.toThrow();
    });
  });

  describe('insert side effects', () => {
    test('troopMovementAdventure - should materialize accrued points before spending one', async () => {
      using database = await prepareTestDatabase();
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

      insertTestEvents(database, [
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
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      const villageTileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
        bind: { $village_id: villageId },
        schema: tileIdSchema,
      })!;

      // Seed some troops
      database.exec({
        sql: `
          DELETE FROM troops
          WHERE
            unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE')
            AND tile_id = $tile_id
        `,
        bind: { $tile_id: villageTileId },
      });

      database.exec({
        sql: `
          INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
          VALUES
            ((SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 100, $tile_id, $tile_id)
        `,
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

      insertTestEvents(database, [event]);

      const amount = database.selectValue({
        sql: `
          SELECT
            amount
          FROM
            troops
          WHERE
            unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE')
            AND tile_id = $tile_id
        `,
        bind: { $tile_id: villageTileId },
        schema: z.number(),
      });

      expect(amount).toBe(60);
    });

    test('troopMovement - should remove troops for multiple movements', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const villageTileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
        bind: { $village_id: villageId },
        schema: tileIdSchema,
      })!;

      // Seed some troops
      database.exec({
        sql: `
          DELETE FROM troops
          WHERE
            unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE')
            AND tile_id = $tile_id
        `,
        bind: { $tile_id: villageTileId },
      });

      database.exec({
        sql: `
          INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
          VALUES
            ((SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 100, $tile_id, $tile_id)
        `,
        bind: { $tile_id: villageTileId },
      });

      database.exec({
        sql: `
          DELETE FROM troops
          WHERE
            unit_id = (SELECT id FROM unit_ids WHERE unit = 'PRAETORIAN')
            AND tile_id = $tile_id
        `,
        bind: { $tile_id: villageTileId },
      });

      database.exec({
        sql: `
          INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
          VALUES
            ((SELECT id FROM unit_ids WHERE unit = 'PRAETORIAN'), 100, $tile_id, $tile_id)
        `,
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

      insertTestEvents(database, events);

      const getAmount = (unit: Unit['id']) =>
        database.selectValue({
          sql: `
            SELECT
              amount
            FROM
              troops
            WHERE
              unit_id = (SELECT id FROM unit_ids WHERE unit = $unit)
              AND tile_id = $tile_id
          `,
          bind: { $unit: unit, $tile_id: villageTileId },
          schema: z.number(),
        });

      expect(getAmount('LEGIONNAIRE')).toBe(60);
      expect(getAmount('PRAETORIAN')).toBe(40);
    });

    test('troopTraining - should remove wounded troops when healing is queued', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestWoundedTroopAmount(
        database,
        villageId,
        'LEGIONNAIRE',
        10,
        Date.now() + 60_000,
      );

      insertTestEvents(database, [
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

  describe('creation cost', () => {
    test('buildingLevelUp - should return zero cost if free building construction enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(
        database,
        'is_free_building_construction_enabled',
        1,
      );

      const event = createBuildingLevelChangeEventMock();

      const result = getCreationRules(database, event).cost();

      expect(result).toStrictEqual([0, 0, 0, 0]);
    });

    test('buildingLevelUp - should return non-zero cost if free building construction disabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(
        database,
        'is_free_building_construction_enabled',
        0,
      );

      const event = createBuildingLevelChangeEventMock();

      const result = getCreationRules(database, event).cost();

      expect(result).toHaveLength(4);
      expect(result.some((v) => v > 0)).toBe(true);
    });

    test('unitResearch - should return zero cost if free unit research enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_free_unit_research_enabled', 1);

      const event = createUnitResearchEventMock();

      expect(getCreationRules(database, event).cost()).toStrictEqual([
        0, 0, 0, 0,
      ]);
    });

    test('unitImprovement - should return zero cost if free unit improvement enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_free_unit_improvement_enabled', 1);

      const event = createUnitImprovementEventMock();

      expect(getCreationRules(database, event).cost()).toStrictEqual([
        0, 0, 0, 0,
      ]);
    });

    test('troopTraining - should return zero cost if free unit training enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_free_unit_training_enabled', 1);

      const event = createTroopTrainingEventMock({
        amount: 10,
      });

      expect(getCreationRules(database, event).cost()).toStrictEqual([
        0, 0, 0, 0,
      ]);
    });

    test('animalCageProduction - should return zero cost if free unit training enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_free_unit_training_enabled', 1);

      const event = createAnimalCageProductionEventMock({
        amount: 2,
      });

      expect(getCreationRules(database, event).cost()).toStrictEqual([
        0, 0, 0, 0,
      ]);
    });

    test('trapperCageProduction - should return zero cost if free unit training enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_free_unit_training_enabled', 1);

      const event = createTrapperCageProductionEventMock({
        amount: 2,
      });

      expect(getCreationRules(database, event).cost()).toStrictEqual([
        0, 0, 0, 0,
      ]);
    });

    test('animalCageProduction - should return cost for the full cage batch', async () => {
      using database = await prepareTestDatabase();

      const event = createAnimalCageProductionEventMock({
        amount: 2,
      });

      expect(getCreationRules(database, event).cost()).toStrictEqual(
        ANIMAL_CAGE_COST.map((cost) => cost * 2),
      );
    });

    test('trapperCageProduction - should return cost for the full cage batch', async () => {
      using database = await prepareTestDatabase();

      const event = createTrapperCageProductionEventMock({
        amount: 2,
      });

      expect(getCreationRules(database, event).cost()).toStrictEqual(
        TRAPPER_CAGE_COST.map((cost) => cost * 2),
      );
    });

    test.each([
      ['BARRACKS', 'GREAT_BARRACKS'],
      ['STABLE', 'GREAT_STABLE'],
    ] as const)(
      'troopTraining - should return tripled cost for %s vs %s',
      async (buildingId, greatBuildingId) => {
        using database = await prepareTestDatabase();

        setTestDeveloperSetting(database, 'is_free_unit_training_enabled', 0);

        const baseEvent = createTroopTrainingEventMock({
          buildingId,
          amount: 10,
        });

        const greatEvent = {
          ...baseEvent,
          buildingId: greatBuildingId,
        } as GameEvent<'troopTraining'>;

        const baseCost = getCreationRules(database, baseEvent).cost();
        const greatCost = getCreationRules(database, greatEvent).cost();

        expect(greatCost).toStrictEqual(baseCost.map((v) => v * 3));
      },
    );

    test('huntersLodgeHunt - should return wheat cost based on party level', async () => {
      using database = await prepareTestDatabase();

      const cost = getCreationRules(
        database,
        createHuntersLodgeHuntEventMock({
          huntingPartyLevel: 3,
        }),
      ).cost();

      expect(cost).toStrictEqual([0, 0, 0, 300]);
    });

    test('huntersLodgeHunt - should return zero cost if free hunting parties enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_free_hunting_parties_enabled', 1);

      const cost = getCreationRules(
        database,
        createHuntersLodgeHuntEventMock({
          huntingPartyLevel: 3,
        }),
      ).cost();

      expect(cost).toStrictEqual([0, 0, 0, 0]);
    });

    test('heroRevival - should return correct cost', async () => {
      using database = await prepareTestDatabase();
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

      const result = getCreationRules(
        database,
        createHeroRevivalEventMock({
          villageId,
        }),
      ).cost();

      expect(result).toStrictEqual(expectedCost);
    });

    test('heroRevival - should return zero cost if free hero revival enabled', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestDeveloperSetting(database, 'is_free_hero_revive_enabled', 1);

      const result = getCreationRules(
        database,
        createHeroRevivalEventMock({
          villageId,
        }),
      ).cost();

      expect(result).toStrictEqual([0, 0, 0, 0]);
    });
  });

  describe('event duration', () => {
    test('buildingConstruction - should return 0', async () => {
      using database = await prepareTestDatabase();
      const event = createGameEventMock('buildingConstruction');

      expect(getCreationRules(database, event).duration(Date.now())).toBe(0);
    });

    test('buildingDestruction - should return duration based on level and server speed', async () => {
      using database = await prepareTestDatabase();
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

      expect(getCreationRules(database, event).duration(Date.now())).toBe(
        expectedDuration,
      );
    });

    test('buildingLevelUp - should return 0 if instant construction enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(
        database,
        'is_instant_building_construction_enabled',
        1,
      );

      const event = createBuildingLevelChangeEventMock({
        villageId: getAnyVillageId(database),
      });

      expect(getCreationRules(database, event).duration(Date.now())).toBe(0);
    });

    test('unitResearch - should return 0 if instant research enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_instant_unit_research_enabled', 1);

      const event = createUnitResearchEventMock({
        villageId: getAnyVillageId(database),
      });

      expect(getCreationRules(database, event).duration(Date.now())).toBe(0);
    });

    test('unitImprovement - should return 0 if instant improvement enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(
        database,
        'is_instant_unit_improvement_enabled',
        1,
      );

      const event = createUnitImprovementEventMock({
        villageId: getAnyVillageId(database),
      });

      expect(getCreationRules(database, event).duration(Date.now())).toBe(0);
    });

    test('troopTraining - should return 0 if instant training enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_instant_unit_training_enabled', 1);

      const event = createTroopTrainingEventMock({
        villageId: getAnyVillageId(database),
        amount: 10,
      });

      expect(getCreationRules(database, event).duration(Date.now())).toBe(0);
    });

    test('animalCageProduction - should return 0 if instant unit training enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_instant_unit_training_enabled', 1);

      const event = createAnimalCageProductionEventMock({
        amount: 3,
      });

      expect(getCreationRules(database, event).duration(Date.now())).toBe(0);
    });

    test('trapperCageProduction - should return 0 if instant unit training enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_instant_unit_training_enabled', 1);

      const event = createTrapperCageProductionEventMock({
        amount: 3,
      });

      expect(getCreationRules(database, event).duration(Date.now())).toBe(0);
    });

    test('buildingLevelUp - should apply effects and return a positive duration', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(
        database,
        'is_instant_building_construction_enabled',
        0,
      );

      const event = createBuildingLevelChangeEventMock({
        villageId: getAnyVillageId(database),
      });

      const result = getCreationRules(database, event).duration(Date.now());

      expect(result).toBeGreaterThan(0);
    });

    test('unitResearch - should apply effects and return a positive duration', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_instant_unit_research_enabled', 0);

      const event = createUnitResearchEventMock({
        villageId: getAnyVillageId(database),
      });

      const result = getCreationRules(database, event).duration(Date.now());

      expect(result).toBeGreaterThan(0);
    });

    test('unitImprovement - should apply effects and return a positive duration', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(
        database,
        'is_instant_unit_improvement_enabled',
        0,
      );

      const event = createUnitImprovementEventMock({
        villageId: getAnyVillageId(database),
      });

      const result = getCreationRules(database, event).duration(Date.now());

      expect(result).toBeGreaterThan(0);
    });

    test('troopTraining - should apply effects and return a positive duration', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_instant_unit_training_enabled', 0);

      const event = createTroopTrainingEventMock({
        villageId: getAnyVillageId(database),
        amount: 10,
      });

      const result = getCreationRules(database, event).duration(Date.now());

      expect(result).toBeGreaterThan(0);
    });

    test('troopMovementAttack - should apply local speed effects by origin tile id', async () => {
      using database = await prepareTestDatabase();
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
        schema: tileIdSchema,
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

      const durationWithoutBonus = getCreationRules(database, event).duration(
        Date.now(),
      );

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

      expect(getCreationRules(database, event).duration(Date.now())).toBe(
        durationWithoutBonus / 2,
      );
    });

    test('troopMovementAttack - should use current hero speed for hero movements', async () => {
      using database = await prepareTestDatabase();
      const village = getAnyVillageWithTile(database);

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
        schema: tileIdSchema,
      })!;

      const event = createTroopMovementAttackEventMock({
        villageId: village.id,
        originTileId: village.tileId,
        targetTileId,
        troops: [
          {
            unitId: 'HERO',
            amount: 1,
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

      database.exec({
        sql: 'UPDATE heroes SET speed = 5 WHERE player_id = $player_id;',
        bind: { $player_id: PLAYER_ID },
      });

      const durationWithSpeedFive = getCreationRules(database, event).duration(
        Date.now(),
      );

      database.exec({
        sql: 'UPDATE heroes SET speed = 10 WHERE player_id = $player_id;',
        bind: { $player_id: PLAYER_ID },
      });

      expect(
        getCreationRules(database, event).duration(Date.now()),
      ).toBeCloseTo(durationWithSpeedFive / 2);
    });

    test('troopTraining - should heal troops in half the normal training duration', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_instant_unit_training_enabled', 0);

      const villageId = getAnyVillageId(database);

      const normalDuration = getCreationRules(
        database,
        createTroopTrainingEventMock({
          villageId,
          buildingId: 'BARRACKS',
          durationEffectId: 'hospitalTrainingDuration',
          unitId: 'LEGIONNAIRE',
        }),
      ).duration(Date.now());

      const healingDuration = getCreationRules(
        database,
        createTroopTrainingEventMock({
          villageId,
          buildingId: 'HOSPITAL',
          durationEffectId: 'hospitalTrainingDuration',
          unitId: 'LEGIONNAIRE',
        }),
      ).duration(Date.now());

      expect(healingDuration).toBe(normalDuration / 2);
    });

    test('animalCageProduction - should return per-cage duration based on server speed', async () => {
      using database = await prepareTestDatabase();

      database.exec({
        sql: 'UPDATE servers SET speed = $speed',
        bind: { $speed: 2 },
      });

      const event = createAnimalCageProductionEventMock({
        amount: 3,
      });

      expect(getCreationRules(database, event).duration(Date.now())).toBe(
        ANIMAL_CAGE_BASE_DURATION / 2,
      );
    });

    test('trapperCageProduction - should return per-cage duration based on server speed', async () => {
      using database = await prepareTestDatabase();

      database.exec({
        sql: 'UPDATE servers SET speed = $speed',
        bind: { $speed: 2 },
      });

      const event = createTrapperCageProductionEventMock({
        amount: 3,
      });

      expect(getCreationRules(database, event).duration(Date.now())).toBe(
        TRAPPER_CAGE_BASE_DURATION / 2,
      );
    });

    test('huntersLodgeHunt - should return duration based on party level and server speed', async () => {
      using database = await prepareTestDatabase();

      database.exec({
        sql: 'UPDATE servers SET speed = $speed',
        bind: { $speed: 2 },
      });

      const result = getCreationRules(
        database,
        createHuntersLodgeHuntEventMock({
          huntingPartyLevel: 4,
        }),
      ).duration(Date.now());

      expect(result).toBe((4 * 30 * 60 * 1000) / 2);
    });

    test('huntersLodgeHunt - should return zero duration if instant unit travel enabled', async () => {
      using database = await prepareTestDatabase();

      setTestDeveloperSetting(database, 'is_instant_unit_travel_enabled', 1);

      const result = getCreationRules(
        database,
        createHuntersLodgeHuntEventMock({
          huntingPartyLevel: 4,
        }),
      ).duration(Date.now());

      expect(result).toBe(0);
    });

    test('heroRevival - should apply server speed and return correct duration', async () => {
      using database = await prepareTestDatabase();
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

      const result = getCreationRules(
        database,
        createHeroRevivalEventMock({
          villageId,
        }),
      ).duration(Date.now());

      expect(result).toBe(expectedDuration);
    });

    test('heroRevival - should return zero duration if instant hero revival enabled', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      setTestDeveloperSetting(database, 'is_instant_hero_revive_enabled', 1);

      const result = getCreationRules(
        database,
        createHeroRevivalEventMock({
          villageId,
        }),
      ).duration(Date.now());

      expect(result).toBe(0);
    });
  });

  describe(createEvents, () => {
    test.each(['wood', 'clay', 'iron', 'wheat'] as const)(
      'rejects insufficient %s before changing resources or inserting an event',
      async (resource) => {
        using database = await prepareTestDatabase();
        const { id: villageId, tileId } = getAnyVillageWithTile(database);
        const now = Date.now();
        const event = createBuildingLevelChangeEventMock({
          villageId,
          buildingId: 'WHEAT_FIELD',
          buildingFieldId: 1,
          previousLevel: 1,
          level: 2,
          startsAt: now,
        });

        setTestDeveloperSetting(
          database,
          'is_free_building_construction_enabled',
          0,
        );

        const [wood, clay, iron, wheat] = getCreationRules(
          database,
          event,
        ).cost();
        const resources = { wood, clay, iron, wheat };

        expect(resources[resource]).toBeGreaterThan(0);

        resources[resource] -= 1;
        database.exec({
          sql: `
            UPDATE resource_sites
            SET
              wood = $wood,
              clay = $clay,
              iron = $iron,
              wheat = $wheat,
              updated_at = $now
            WHERE
              tile_id = $tile_id;
          `,
          bind: {
            $wood: resources.wood,
            $clay: resources.clay,
            $iron: resources.iron,
            $wheat: resources.wheat,
            $now: now,
            $tile_id: tileId,
          },
        });

        const eventCount = database.selectValue({
          sql: 'SELECT COUNT(*) FROM events;',
          schema: z.number(),
        });

        expect(() =>
          createEvents<'buildingLevelChange'>(database, {
            type: event.type,
            villageId,
            buildingId: event.buildingId,
            buildingFieldId: event.buildingFieldId,
            previousLevel: event.previousLevel,
            level: event.level,
            startsAt: now,
            duration: 1000,
          }),
        ).toThrow('Not enough resources');
        expect(
          database.selectObject({
            sql: 'SELECT wood, clay, iron, wheat, updated_at FROM resource_sites WHERE tile_id = $tile_id;',
            bind: { $tile_id: tileId },
            schema: z.strictObject({
              ...resourcesSchema.shape,
              updated_at: z.number(),
            }),
          }),
        ).toStrictEqual({ ...resources, updated_at: now });
        expect(
          database.selectValue({
            sql: 'SELECT COUNT(*) FROM events;',
            schema: z.number(),
          }),
        ).toBe(eventCount);
      },
    );

    test.each([
      {
        name: 'rejects spending future production',
        offset: 3_600_000,
        reject: true,
      },
      {
        name: 'allows spending production accrued since a past start time',
        offset: -3_600_000,
        reject: false,
      },
    ])('huntersLodgeHunt - $name', async ({ offset, reject }) => {
      using database = await prepareTestDatabase();
      const { id: villageId, tileId } = getAnyVillageWithTile(database);
      const now = 10_000_000;

      vi.useFakeTimers();
      vi.setSystemTime(now);

      try {
        setTestBuildingLevel(database, villageId, 'HUNTERS_LODGE', 3);

        const updatedAt = Math.min(now, now + offset);

        database.exec({
          sql: `
            UPDATE resource_sites
            SET
              wood = 700,
              clay = 700,
              iron = 700,
              wheat = 0,
              updated_at = $updated_at
            WHERE
              tile_id = $tile_id;
          `,
          bind: { $tile_id: tileId, $updated_at: updatedAt },
        });

        database.exec({
          sql: `
            UPDATE effects
            SET
              value = 3600
            WHERE
              tile_id = $tile_id
              AND source_specifier = 0
              AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction')
              AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building');
          `,
          bind: { $tile_id: tileId },
        });

        const args = {
          type: 'huntersLodgeHunt' as const,
          villageId,
          huntingPartyLevel: 2,
          startsAt: now + offset,
        };

        const expected = calculateResourceSiteResourcesAt(
          database,
          tileId,
          now,
        );

        if (reject) {
          expect(() => createEvents(database, args)).toThrow(
            'Not enough resources',
          );
        } else {
          expect(expected.currentWheat).toBeGreaterThanOrEqual(200);

          createEvents(database, args);
        }

        expect(
          database.selectObject({
            sql: 'SELECT wheat, updated_at FROM resource_sites WHERE tile_id = $tile_id;',
            bind: { $tile_id: tileId },
            schema: z.strictObject({
              wheat: resourcesSchema.shape.wheat,
              updated_at: z.number(),
            }),
          }),
        ).toStrictEqual(
          reject
            ? { wheat: 0, updated_at: updatedAt }
            : { wheat: expected.currentWheat - 200, updated_at: now },
        );
        expect(
          database.selectValue({
            sql: "SELECT COUNT(*) FROM events WHERE village_id = $village_id AND type = 'huntersLodgeHunt';",
            bind: { $village_id: villageId },
            schema: z.number(),
          }),
        ).toBe(reject ? 0 : 1);
      } finally {
        vi.useRealTimers();
      }
    });

    test('should reject incomplete event payloads before persistence', async () => {
      using database = await prepareTestDatabase();

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

    test('troopTraining - charges the full batch when it is queued', async () => {
      using database = await prepareTestDatabase();
      const { id: villageId, tileId } = getAnyVillageWithTile(database);
      const now = Date.now();
      using _clock = vi.spyOn(Date, 'now').mockReturnValue(now);

      setTestBuildingLevel(database, villageId, 'BARRACKS', 1, 19);
      setTestDeveloperSetting(database, 'is_free_unit_training_enabled', 0);

      const args = {
        type: 'troopTraining',
        villageId,
        unitId: 'PHALANX',
        amount: 2,
        buildingId: 'BARRACKS',
        batchId: 'paid-training-batch',
        durationEffectId: 'barracksTrainingDuration',
        startsAt: now + 60_000,
        duration: 1000,
      } as const;
      const [wood, clay, iron, wheat] = getUnitDefinition(
        args.unitId,
      ).baseRecruitmentCost;

      database.exec({
        sql: `
          UPDATE resource_sites
          SET wood = $wood, clay = $clay, iron = $iron, wheat = $wheat,
              updated_at = $now
          WHERE tile_id = $tile_id;
        `,
        bind: {
          $wood: wood * 2 - 1,
          $clay: clay * 2,
          $iron: iron * 2,
          $wheat: wheat * 2,
          $now: now,
          $tile_id: tileId,
        },
      });

      const readBatchStartTimes = () =>
        database.selectObjects({
          sql: `
            SELECT starts_at AS startsAt
            FROM events
            WHERE type = 'troopTraining'
              AND json_extract(meta, '$.batchId') = $batch_id
            ORDER BY starts_at;
          `,
          bind: { $batch_id: args.batchId },
          schema: z.strictObject({ startsAt: z.number() }),
        });

      expect(() => createEvents<'troopTraining'>(database, args)).toThrow(
        'Not enough resources',
      );
      expect(readBatchStartTimes()).toStrictEqual([]);
      expect(
        calculateResourceSiteResourcesAt(database, tileId, now),
      ).toMatchObject({
        currentWood: wood * 2 - 1,
        currentClay: clay * 2,
        currentIron: iron * 2,
        currentWheat: wheat * 2,
      });

      database.exec({
        sql: 'UPDATE resource_sites SET wood = wood + 1 WHERE tile_id = $tile_id;',
        bind: { $tile_id: tileId },
      });

      createEvents<'troopTraining'>(database, args);

      expect(readBatchStartTimes()).toStrictEqual([
        { startsAt: args.startsAt },
        { startsAt: args.startsAt + args.duration },
      ]);
      expect(
        calculateResourceSiteResourcesAt(database, tileId, now),
      ).toMatchObject({
        currentWood: 0,
        currentClay: 0,
        currentIron: 0,
        currentWheat: 0,
      });
    });

    test('troopTraining - should complete queued troop count quests when units are queued', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const now = 1_234_000;

      vi.useFakeTimers();
      vi.setSystemTime(now);

      setTestDeveloperSetting(database, 'is_free_unit_training_enabled', 1);
      setTestDeveloperSetting(database, 'is_instant_unit_training_enabled', 1);

      setTestBuildingLevel(database, villageId, 'BARRACKS', 1, 19);

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
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);
      const now = 1_000_000;

      vi.useFakeTimers();
      vi.setSystemTime(now);
      setTestBuildingLevel(database, villageId, 'HUNTERS_LODGE', 3);

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

      using selectValue = vi.spyOn(database, 'selectValue');

      createEvents<'huntersLodgeHunt'>(database, {
        type: 'huntersLodgeHunt',
        villageId,
        huntingPartyLevel: 2,
      });

      expect(
        selectValue.mock.calls.filter(
          ([args]) =>
            args.sql ===
            selectResourceSiteResourcesRelevantEffectsByTileIdQuery,
        ),
      ).toHaveLength(1);

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

  describe('queue start time', () => {
    test('troopTraining - should return now if no previous events', async () => {
      using database = await prepareTestDatabase();
      const villageId = getAnyVillageId(database);

      vi.useFakeTimers();

      const now = 1_234_567_890;

      vi.setSystemTime(new Date(now));

      const event = createTroopTrainingEventMock({
        villageId,
      });

      expect(getCreationRules(database, event).startTime()).toBe(now);

      vi.useRealTimers();
    });

    test('troopTraining - should return end of last event in queue', async () => {
      using database = await prepareTestDatabase();
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

      expect(getCreationRules(database, newEvent).startTime()).toBe(1500);
    });

    test('unitImprovement - should return last resolves_at or now', async () => {
      using database = await prepareTestDatabase();
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

      const startTime = getCreationRules(
        database,
        createUnitImprovementEventMock(),
      ).startTime();

      expect(startTime).toBe(2500);
    });

    test('returnTroopMovement - should return now for manually triggered return', async () => {
      using database = await prepareTestDatabase();

      vi.useFakeTimers();

      const now = 5000;

      vi.setSystemTime(new Date(now));

      const event = createGameEventMock('troopMovementReturn', {
        originalMovementType: 'troopMovementReturnReinforcements',
        startsAt: 2000,
        duration: 1000,
      });

      expect(getCreationRules(database, event).startTime()).toBe(now);

      vi.useRealTimers();
    });

    test('returnTroopMovement - uses the supplied start time for an automatic return', async () => {
      using database = await prepareTestDatabase();
      const { id: villageId, tileId } = getAnyVillageWithTile(database);
      const startsAt = 3000;

      createEvents<'troopMovementReturn'>(database, {
        type: 'troopMovementReturn',
        villageId,
        startsAt,
        duration: 1000,
        originTileId: tileId,
        targetTileId: tileId,
        troops: [],
        originalMovementType: 'troopMovementAttack',
      });

      expect(
        database.selectValue({
          sql: `
            SELECT starts_at
            FROM events
            WHERE type = 'troopMovementReturn'
            ORDER BY id DESC
            LIMIT 1;
          `,
          schema: z.number(),
        }),
      ).toBe(startsAt);
    });

    test('buildingConstruction - should return now', async () => {
      using database = await prepareTestDatabase();

      vi.useFakeTimers();

      const now = 9_999_999;

      vi.setSystemTime(new Date(now));

      const result = getCreationRules(
        database,
        createBuildingConstructionEventMock(),
      ).startTime();

      expect(result).toBe(now);

      vi.useRealTimers();
    });
  });

  describe('resource debit timestamp', () => {
    test('should return now even if the event starts in the future (repro for incorrect resource subtraction)', async () => {
      using database = await prepareTestDatabase();
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
        sql: `
          INSERT OR IGNORE INTO unit_research (village_id, unit_id)
          VALUES
            ($village_id, (SELECT id FROM unit_ids WHERE unit = $unit))
        `,
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
      const resultTimestamp = getCreationRules(
        database,
        trainingEvent,
      ).chargeAt(futureStartsAt);

      // It MUST return 'now', not 'futureStartsAt'
      expect(resultTimestamp).toBe(now);

      vi.useRealTimers();
    });
  });
});
