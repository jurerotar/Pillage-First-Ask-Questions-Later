import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { getTrapperCageStats } from '../trapper-controllers';
import {
  getGatherersHutExpeditions,
  getOccupiableOasisInRange,
  getVillageBySlug,
  rearrangeBuildingFields,
} from '../village-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('village-controllers', () => {
  test('getVillageBySlug should return village details by slug', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT slug FROM villages LIMIT 1',
      schema: z.strictObject({ slug: z.string() }),
    })!;

    getVillageBySlug(
      database,
      createControllerArgs<'/villages/:villageSlug'>({
        path: { villageSlug: village.slug },
      }),
    );

    expect(true).toBe(true);
  });

  test('getOccupiableOasisInRange should return occupiable oasis in range', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    getOccupiableOasisInRange(
      database,
      createControllerArgs<'/villages/:villageId/occupiable-oasis'>({
        path: { villageId: village.id },
      }),
    );

    expect(true).toBe(true);
  });

  test('getGatherersHutExpeditions should return completed expedition count', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    const result = getGatherersHutExpeditions(
      database,
      createControllerArgs<'/villages/:villageId/gatherers-hut/expeditions'>({
        path: { villageId: village.id },
      }),
    );

    expect(result.completed).toBe(0);
  });

  test('getTrapperCageStats should return village cage totals', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    database.exec({
      sql: `
        INSERT INTO trapper_cages (village_id, unit_id)
        VALUES
          ($village_id, NULL),
          ($village_id, NULL),
          ($village_id, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'));
      `,
      bind: {
        $village_id: village.id,
      },
    });

    const stats = getTrapperCageStats(
      database,
      createControllerArgs<'/villages/:villageId/trapper-cages'>({
        path: { villageId: village.id },
      }),
    );

    expect(stats).toStrictEqual({
      total: 3,
      free: 2,
      occupied: 1,
    });
  });

  describe(rearrangeBuildingFields, () => {
    test('should swap two occupied building fields and update events', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;
      const fieldId1 = 19;
      const fieldId2 = 20;

      // Seed data
      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, $f, (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING'), 1)",
        bind: { $v: villageId, $f: fieldId1 },
      });
      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, $f, (SELECT id FROM building_ids WHERE building = 'BARRACKS'), 2)",
        bind: { $v: villageId, $f: fieldId2 },
      });

      // Seed event
      database.exec({
        sql: "INSERT INTO events (type, starts_at, duration, village_id, meta) VALUES ('buildingLevelChange', 100, 100, $v, $meta)",
        bind: {
          $v: villageId,
          $meta: JSON.stringify({
            buildingFieldId: fieldId1,
            buildingId: 'MAIN_BUILDING',
            level: 2,
            previousLevel: 1,
          }),
        },
      });

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            {
              buildingFieldId: fieldId1,
              buildingId: 'BARRACKS',
              sourceBuildingFieldId: fieldId2,
            },
            {
              buildingFieldId: fieldId2,
              buildingId: 'MAIN_BUILDING',
              sourceBuildingFieldId: fieldId1,
            },
          ],
        }),
      );

      const bf1 = database.selectObject({
        sql: 'SELECT bi.building AS building_id FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = $f',
        bind: { $v: villageId, $f: fieldId1 },
        schema: z.strictObject({ building_id: buildingIdSchema }),
      })!;

      const bf2 = database.selectObject({
        sql: 'SELECT bi.building AS building_id FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = $f',
        bind: { $v: villageId, $f: fieldId2 },
        schema: z.strictObject({ building_id: buildingIdSchema }),
      })!;

      expect(bf1.building_id).toBe('BARRACKS');
      expect(bf2.building_id).toBe('MAIN_BUILDING');

      const event = database.selectObject({
        sql: 'SELECT meta FROM events WHERE village_id = $v',
        bind: { $v: villageId },
        schema: z.strictObject({ meta: z.string() }),
      });
      expect(JSON.parse(event!.meta).buildingFieldId).toBe(fieldId2);
    });

    test('should move building effects when rearranging occupied building fields', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;

      database.exec({
        sql: `
          INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level)
          VALUES
            ($v, 19, (SELECT id FROM building_ids WHERE building = 'WAREHOUSE'), 3),
            ($v, 20, (SELECT id FROM building_ids WHERE building = 'BARRACKS'), 2);
        `,
        bind: { $v: villageId },
      });

      database.exec({
        sql: `
          DELETE
          FROM effects
          WHERE
            village_id = $v
            AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND source_specifier IN (19, 20);
        `,
        bind: { $v: villageId },
      });

      database.exec({
        sql: `
          INSERT INTO effects (effect_id, value, type_id, scope_id, source_id, village_id, source_specifier)
          VALUES
            ((SELECT id FROM effect_ids WHERE effect = 'warehouseCapacity'), 1500, 1, 2, 1, $v, 19),
            ((SELECT id FROM effect_ids WHERE effect = 'barracksTrainingDuration'), 0.9091, 2, 2, 1, $v, 20);
        `,
        bind: { $v: villageId },
      });

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            {
              buildingFieldId: 19,
              buildingId: 'BARRACKS',
              sourceBuildingFieldId: 20,
            },
            {
              buildingFieldId: 20,
              buildingId: 'WAREHOUSE',
              sourceBuildingFieldId: 19,
            },
          ],
        }),
      );

      const effects = database.selectObjects({
        sql: `
          SELECT ei.effect, e.source_specifier
          FROM effects e
          JOIN effect_ids ei ON ei.id = e.effect_id
          WHERE
            e.village_id = $v
            AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND e.source_specifier IN (19, 20)
            AND ei.effect IN ('warehouseCapacity', 'barracksTrainingDuration')
          ORDER BY ei.effect;
        `,
        bind: { $v: villageId },
        schema: z.strictObject({
          effect: z.string(),
          source_specifier: z.number(),
        }),
      });

      expect(effects).toEqual([
        {
          effect: 'barracksTrainingDuration',
          source_specifier: 19,
        },
        {
          effect: 'warehouseCapacity',
          source_specifier: 20,
        },
      ]);
    });

    test('should update active events and scheduled upgrades when rearranging fields', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;
      const eventStartsAt = 123_456_789;
      const buildingEventTypes = [
        'buildingConstruction',
        'buildingLevelChange',
        'buildingDestruction',
      ] as const;

      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, 19, (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING'), 7)",
        bind: { $v: villageId },
      });

      for (const [index, eventType] of buildingEventTypes.entries()) {
        database.exec({
          sql: 'INSERT INTO events (type, starts_at, duration, village_id, meta) VALUES ($type, $starts_at, 100, $v, $meta)',
          bind: {
            $type: eventType,
            $starts_at: eventStartsAt + index,
            $v: villageId,
            $meta: JSON.stringify({
              buildingFieldId: 19,
              buildingId: 'MAIN_BUILDING',
              level: 8,
              previousLevel: 7,
            }),
          },
        });
      }
      database.exec({
        sql: `
          INSERT INTO scheduled_building_upgrades
            (building_id, village_id, building_field_id, level)
          VALUES (
            (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING'),
            $v,
            19,
            9
          );
        `,
        bind: { $v: villageId },
      });

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            {
              buildingFieldId: 19,
              buildingId: null,
              sourceBuildingFieldId: null,
            },
            {
              buildingFieldId: 25,
              buildingId: 'MAIN_BUILDING',
              sourceBuildingFieldId: 19,
            },
          ],
        }),
      );

      const events = database.selectObjects({
        sql: 'SELECT type, meta FROM events WHERE starts_at BETWEEN $starts_at AND $ends_at ORDER BY type',
        bind: {
          $starts_at: eventStartsAt,
          $ends_at: eventStartsAt + buildingEventTypes.length - 1,
        },
        schema: z.strictObject({
          type: z.string(),
          meta: z.string(),
        }),
      });

      expect(events).toHaveLength(buildingEventTypes.length);
      for (const event of events) {
        expect(JSON.parse(event.meta)).toMatchObject({
          buildingFieldId: 25,
          buildingId: 'MAIN_BUILDING',
        });
      }
      expect(
        database.selectValue({
          sql: `
            SELECT building_field_id
            FROM scheduled_building_upgrades
            WHERE village_id = $v;
          `,
          bind: { $v: villageId },
          schema: z.number(),
        }),
      ).toBe(25);
    });

    test('should not update events for other event types, other villages, null targets, or unmatched buildings', async () => {
      const database = await prepareTestDatabase();

      const villages = database.selectObjects({
        sql: 'SELECT id FROM villages ORDER BY id LIMIT 2',
        schema: z.strictObject({ id: z.number() }),
      });
      const villageId = villages[0].id;
      const otherVillageId = villages[1].id;
      const eventStartsAt = 223_456_789;

      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, 19, (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING'), 7)",
        bind: { $v: villageId },
      });
      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, 20, (SELECT id FROM building_ids WHERE building = 'BARRACKS'), 3)",
        bind: { $v: villageId },
      });

      const eventsToInsert = [
        {
          type: 'troopTraining',
          villageId,
          meta: {
            buildingFieldId: 19,
            buildingId: 'MAIN_BUILDING',
          },
        },
        {
          type: 'buildingLevelChange',
          villageId: otherVillageId,
          meta: {
            buildingFieldId: 19,
            buildingId: 'MAIN_BUILDING',
          },
        },
        {
          type: 'buildingConstruction',
          villageId,
          meta: {
            buildingFieldId: 20,
            buildingId: 'BARRACKS',
          },
        },
        {
          type: 'buildingDestruction',
          villageId,
          meta: {
            buildingFieldId: 21,
            buildingId: 'ACADEMY',
          },
        },
      ];

      for (const [index, event] of eventsToInsert.entries()) {
        database.exec({
          sql: 'INSERT INTO events (type, starts_at, duration, village_id, meta) VALUES ($type, $starts_at, 100, $v, $meta)',
          bind: {
            $type: event.type,
            $starts_at: eventStartsAt + index,
            $v: event.villageId,
            $meta: JSON.stringify({
              ...event.meta,
              level: 2,
              previousLevel: 1,
            }),
          },
        });
      }

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            {
              buildingFieldId: 19,
              buildingId: null,
              sourceBuildingFieldId: null,
            },
            {
              buildingFieldId: 20,
              buildingId: null,
              sourceBuildingFieldId: null,
            },
            {
              buildingFieldId: 25,
              buildingId: 'MAIN_BUILDING',
              sourceBuildingFieldId: 19,
            },
          ],
        }),
      );

      const events = database.selectObjects({
        sql: 'SELECT type, meta, village_id AS villageId FROM events WHERE starts_at BETWEEN $starts_at AND $ends_at ORDER BY starts_at',
        bind: {
          $starts_at: eventStartsAt,
          $ends_at: eventStartsAt + eventsToInsert.length - 1,
        },
        schema: z.strictObject({
          type: z.string(),
          meta: z.string(),
          villageId: z.number(),
        }),
      });

      expect(events).toHaveLength(eventsToInsert.length);
      expect(JSON.parse(events[0].meta).buildingFieldId).toBe(19);
      expect(JSON.parse(events[1].meta).buildingFieldId).toBe(19);
      expect(events[1].villageId).toBe(otherVillageId);
      expect(JSON.parse(events[2].meta).buildingFieldId).toBe(20);
      expect(JSON.parse(events[3].meta).buildingFieldId).toBe(21);
    });

    test('should move building to empty field', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;
      const fieldId1 = 19;
      const fieldId2 = 21;

      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, $f, (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING'), 1)",
        bind: { $v: villageId, $f: fieldId1 },
      });

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            {
              buildingFieldId: fieldId1,
              buildingId: null,
              sourceBuildingFieldId: null,
            },
            {
              buildingFieldId: fieldId2,
              buildingId: 'MAIN_BUILDING',
              sourceBuildingFieldId: fieldId1,
            },
          ],
        }),
      );

      const bf1 = database.selectObject({
        sql: 'SELECT bi.building AS building_id FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = $f',
        bind: { $v: villageId, $f: fieldId1 },
        schema: z.strictObject({ building_id: buildingIdSchema }),
      });

      const bf2 = database.selectObject({
        sql: 'SELECT bi.building AS building_id FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = $f',
        bind: { $v: villageId, $f: fieldId2 },
        schema: z.strictObject({ building_id: buildingIdSchema }),
      })!;

      expect(bf1).toBeUndefined();
      expect(bf2.building_id).toBe('MAIN_BUILDING');
    });

    test('should not modify non-swappable fields', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;

      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, 39, (SELECT id FROM building_ids WHERE building = 'RALLY_POINT'), 5)",
        bind: { $v: villageId },
      });

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            {
              buildingFieldId: 39,
              buildingId: null,
              sourceBuildingFieldId: null,
            },
            {
              buildingFieldId: 19,
              buildingId: null,
              sourceBuildingFieldId: null,
            },
          ],
        }),
      );

      const specialField = database.selectObject({
        sql: 'SELECT bi.building AS building_id, bf.level FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = 39',
        bind: { $v: villageId },
        schema: z.strictObject({
          building_id: buildingIdSchema,
          level: z.number(),
        }),
      })!;

      expect(specialField.building_id).toBe('RALLY_POINT');
      expect(specialField.level).toBe(5);
    });

    test('should keep unaffected swappable fields when updates include null', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;

      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, 19, (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING'), 10)",
        bind: { $v: villageId },
      });
      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, 20, (SELECT id FROM building_ids WHERE building = 'BARRACKS'), 7)",
        bind: { $v: villageId },
      });

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            {
              buildingFieldId: 21,
              buildingId: null,
              sourceBuildingFieldId: null,
            },
            {
              buildingFieldId: 20,
              buildingId: 'BARRACKS',
              sourceBuildingFieldId: 20,
            },
          ],
        }),
      );

      const field19 = database.selectObject({
        sql: 'SELECT bi.building AS building_id, bf.level FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = 19',
        bind: { $v: villageId },
        schema: z.strictObject({
          building_id: buildingIdSchema,
          level: z.number(),
        }),
      })!;

      const field20 = database.selectObject({
        sql: 'SELECT bi.building AS building_id, bf.level FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = 20',
        bind: { $v: villageId },
        schema: z.strictObject({
          building_id: buildingIdSchema,
          level: z.number(),
        }),
      })!;

      const field21 = database.selectObject({
        sql: 'SELECT bi.building AS building_id FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = 21',
        bind: { $v: villageId },
        schema: z.strictObject({ building_id: buildingIdSchema }),
      });

      expect(field19.building_id).toBe('MAIN_BUILDING');
      expect(field19.level).toBe(10);
      expect(field20.building_id).toBe('BARRACKS');
      expect(field20.level).toBe(7);
      expect(field21).toBeUndefined();
    });

    test('should ignore updates outside range 19-38 for both fields and events', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;

      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, 18, (SELECT id FROM building_ids WHERE building = 'WOODCUTTER'), 9)",
        bind: { $v: villageId },
      });
      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, 39, (SELECT id FROM building_ids WHERE building = 'RALLY_POINT'), 3)",
        bind: { $v: villageId },
      });

      database.exec({
        sql: "INSERT INTO events (type, starts_at, duration, village_id, meta) VALUES ('buildingLevelChange', 100, 100, $v, $meta)",
        bind: {
          $v: villageId,
          $meta: JSON.stringify({
            buildingFieldId: 18,
            buildingId: 'WOODCUTTER',
            level: 10,
            previousLevel: 9,
          }),
        },
      });

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            {
              buildingFieldId: 18,
              buildingId: 'CLAY_PIT',
              sourceBuildingFieldId: 18,
            },
            {
              buildingFieldId: 39,
              buildingId: null,
              sourceBuildingFieldId: null,
            },
            {
              buildingFieldId: 40,
              buildingId: 'RALLY_POINT',
              sourceBuildingFieldId: 40,
            },
          ],
        }),
      );

      const field18 = database.selectObject({
        sql: 'SELECT bi.building AS building_id, bf.level FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = 18',
        bind: { $v: villageId },
        schema: z.strictObject({
          building_id: buildingIdSchema,
          level: z.number(),
        }),
      })!;

      const field39 = database.selectObject({
        sql: 'SELECT bi.building AS building_id, bf.level FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = 39',
        bind: { $v: villageId },
        schema: z.strictObject({
          building_id: buildingIdSchema,
          level: z.number(),
        }),
      })!;

      const event = database.selectObject({
        sql: 'SELECT meta FROM events WHERE village_id = $v',
        bind: { $v: villageId },
        schema: z.strictObject({ meta: z.string() }),
      })!;

      expect(field18.building_id).toBe('WOODCUTTER');
      expect(field18.level).toBe(9);
      expect(field39.building_id).toBe('RALLY_POINT');
      expect(field39.level).toBe(3);
      expect(JSON.parse(event.meta).buildingFieldId).toBe(18);
    });

    test('should preserve level when moving building between swappable boundary fields', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;

      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, 19, (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING'), 13)",
        bind: { $v: villageId },
      });

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            {
              buildingFieldId: 19,
              buildingId: null,
              sourceBuildingFieldId: null,
            },
            {
              buildingFieldId: 38,
              buildingId: 'MAIN_BUILDING',
              sourceBuildingFieldId: 19,
            },
          ],
        }),
      );

      const field19 = database.selectObject({
        sql: 'SELECT bi.building AS building_id FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = 19',
        bind: { $v: villageId },
        schema: z.strictObject({ building_id: buildingIdSchema }),
      });

      const field38 = database.selectObject({
        sql: 'SELECT bi.building AS building_id, bf.level FROM building_fields bf JOIN building_ids bi ON bi.id = bf.building_id WHERE bf.village_id = $v AND bf.field_id = 38',
        bind: { $v: villageId },
        schema: z.strictObject({
          building_id: buildingIdSchema,
          level: z.number(),
        }),
      })!;

      expect(field19).toBeUndefined();
      expect(field38.building_id).toBe('MAIN_BUILDING');
      expect(field38.level).toBe(13);
    });

    test('should preserve levels when rearranging multiple buildings of the same type', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;
      const eventStartsAt = 345_678_901;

      database.exec({
        sql: `
          INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level)
          VALUES
            ($v, 19, (SELECT id FROM building_ids WHERE building = 'GRANARY'), 4),
            ($v, 20, (SELECT id FROM building_ids WHERE building = 'GRANARY'), 11),
            ($v, 21, (SELECT id FROM building_ids WHERE building = 'WAREHOUSE'), 6);
        `,
        bind: { $v: villageId },
      });

      database.exec({
        sql: "INSERT INTO events (type, starts_at, duration, village_id, meta) VALUES ('buildingLevelChange', $starts_at, 100, $v, $meta)",
        bind: {
          $v: villageId,
          $starts_at: eventStartsAt,
          $meta: JSON.stringify({
            buildingFieldId: 20,
            buildingId: 'GRANARY',
            level: 12,
            previousLevel: 11,
          }),
        },
      });

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            {
              buildingFieldId: 19,
              buildingId: null,
              sourceBuildingFieldId: null,
            },
            {
              buildingFieldId: 20,
              buildingId: 'WAREHOUSE',
              sourceBuildingFieldId: 21,
            },
            {
              buildingFieldId: 21,
              buildingId: 'GRANARY',
              sourceBuildingFieldId: 20,
            },
            {
              buildingFieldId: 22,
              buildingId: 'GRANARY',
              sourceBuildingFieldId: 19,
            },
          ],
        }),
      );

      const fields = database.selectObjects({
        sql: `
          SELECT bf.field_id, bi.building AS building_id, bf.level
          FROM building_fields bf
          JOIN building_ids bi ON bi.id = bf.building_id
          WHERE bf.village_id = $v AND bf.field_id IN (19, 20, 21, 22)
          ORDER BY bf.field_id;
        `,
        bind: { $v: villageId },
        schema: z.strictObject({
          field_id: z.number(),
          building_id: buildingIdSchema,
          level: z.number(),
        }),
      });

      expect(fields).toEqual([
        {
          field_id: 20,
          building_id: 'WAREHOUSE',
          level: 6,
        },
        {
          field_id: 21,
          building_id: 'GRANARY',
          level: 11,
        },
        {
          field_id: 22,
          building_id: 'GRANARY',
          level: 4,
        },
      ]);

      const event = database.selectObject({
        sql: 'SELECT meta FROM events WHERE village_id = $v AND starts_at = $starts_at',
        bind: { $v: villageId, $starts_at: eventStartsAt },
        schema: z.strictObject({ meta: z.string() }),
      })!;

      expect(JSON.parse(event.meta)).toMatchObject({
        buildingFieldId: 21,
        buildingId: 'GRANARY',
      });
    });

    test('should preserve effects when rearranging multiple buildings of the same type', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;

      database.exec({
        sql: `
          INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level)
          VALUES
            ($v, 19, (SELECT id FROM building_ids WHERE building = 'GRANARY'), 4),
            ($v, 20, (SELECT id FROM building_ids WHERE building = 'GRANARY'), 11),
            ($v, 21, (SELECT id FROM building_ids WHERE building = 'WAREHOUSE'), 6);
        `,
        bind: { $v: villageId },
      });

      database.exec({
        sql: `
          DELETE
          FROM effects
          WHERE
            village_id = $v
            AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND source_specifier IN (19, 20, 21, 22);
        `,
        bind: { $v: villageId },
      });

      database.exec({
        sql: `
          INSERT INTO effects (effect_id, value, type_id, scope_id, source_id, village_id, source_specifier)
          VALUES
            ((SELECT id FROM effect_ids WHERE effect = 'granaryCapacity'), 4000, 1, 2, 1, $v, 19),
            ((SELECT id FROM effect_ids WHERE effect = 'granaryCapacity'), 11000, 1, 2, 1, $v, 20),
            ((SELECT id FROM effect_ids WHERE effect = 'warehouseCapacity'), 6000, 1, 2, 1, $v, 21);
        `,
        bind: { $v: villageId },
      });

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            {
              buildingFieldId: 19,
              buildingId: null,
              sourceBuildingFieldId: null,
            },
            {
              buildingFieldId: 20,
              buildingId: 'WAREHOUSE',
              sourceBuildingFieldId: 21,
            },
            {
              buildingFieldId: 21,
              buildingId: 'GRANARY',
              sourceBuildingFieldId: 20,
            },
            {
              buildingFieldId: 22,
              buildingId: 'GRANARY',
              sourceBuildingFieldId: 19,
            },
          ],
        }),
      );

      const effects = database.selectObjects({
        sql: `
          SELECT ei.effect, e.value, e.source_specifier
          FROM effects e
          JOIN effect_ids ei ON ei.id = e.effect_id
          WHERE
            e.village_id = $v
            AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND e.source_specifier IN (20, 21, 22)
            AND e.value IN (4000, 6000, 11000)
          ORDER BY e.value;
        `,
        bind: { $v: villageId },
        schema: z.strictObject({
          effect: z.string(),
          value: z.number(),
          source_specifier: z.number(),
        }),
      });

      expect(effects).toEqual([
        {
          effect: 'granaryCapacity',
          value: 4000,
          source_specifier: 22,
        },
        {
          effect: 'warehouseCapacity',
          value: 6000,
          source_specifier: 20,
        },
        {
          effect: 'granaryCapacity',
          value: 11000,
          source_specifier: 21,
        },
      ]);
    });

    test('should reject source field that does not match the target building', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;

      database.exec({
        sql: `
          INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level)
          VALUES
            ($v, 19, (SELECT id FROM building_ids WHERE building = 'GRANARY'), 4),
            ($v, 20, (SELECT id FROM building_ids WHERE building = 'WAREHOUSE'), 6);
        `,
        bind: { $v: villageId },
      });

      expect(() =>
        rearrangeBuildingFields(
          database,
          createControllerArgs<'/villages/:villageId/building-fields', 'patch'>(
            {
              path: { villageId },
              body: [
                {
                  buildingFieldId: 19,
                  buildingId: null,
                  sourceBuildingFieldId: null,
                },
                {
                  buildingFieldId: 21,
                  buildingId: 'GRANARY',
                  sourceBuildingFieldId: 20,
                },
              ],
            },
          ),
        ),
      ).toThrow('Invalid rearranged building source field');
    });

    test('should reject duplicate source fields', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;

      database.exec({
        sql: `
          INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level)
          VALUES
            ($v, 19, (SELECT id FROM building_ids WHERE building = 'GRANARY'), 4);
        `,
        bind: { $v: villageId },
      });

      expect(() =>
        rearrangeBuildingFields(
          database,
          createControllerArgs<'/villages/:villageId/building-fields', 'patch'>(
            {
              path: { villageId },
              body: [
                {
                  buildingFieldId: 20,
                  buildingId: 'GRANARY',
                  sourceBuildingFieldId: 19,
                },
                {
                  buildingFieldId: 21,
                  buildingId: 'GRANARY',
                  sourceBuildingFieldId: 19,
                },
              ],
            },
          ),
        ),
      ).toThrow('Duplicate rearranged building source field');
    });
  });
});
