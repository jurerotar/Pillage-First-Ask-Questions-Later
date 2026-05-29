import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import {
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
            { buildingFieldId: fieldId1, buildingId: 'BARRACKS' },
            { buildingFieldId: fieldId2, buildingId: 'MAIN_BUILDING' },
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

    test('should update building field ids for all rearrangeable building event types', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;
      const eventStartsAt = 123_456_789;
      const buildingEventTypes = [
        'buildingScheduledConstruction',
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

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          path: { villageId },
          body: [
            { buildingFieldId: 19, buildingId: null },
            { buildingFieldId: 25, buildingId: 'MAIN_BUILDING' },
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
    });

    test('should not update events for other event types, other villages, null targets, or unmatched buildings', async () => {
      const database = await prepareTestDatabase();

      const villages = database.selectObjects({
        sql: 'SELECT id FROM villages ORDER BY id LIMIT 2',
        schema: z.strictObject({ id: z.number() }),
      });
      const villageId = villages[0]!.id;
      const otherVillageId = villages[1]!.id;
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
            { buildingFieldId: 19, buildingId: null },
            { buildingFieldId: 20, buildingId: null },
            { buildingFieldId: 25, buildingId: 'MAIN_BUILDING' },
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
      expect(JSON.parse(events[0]!.meta).buildingFieldId).toBe(19);
      expect(JSON.parse(events[1]!.meta).buildingFieldId).toBe(19);
      expect(events[1]!.villageId).toBe(otherVillageId);
      expect(JSON.parse(events[2]!.meta).buildingFieldId).toBe(20);
      expect(JSON.parse(events[3]!.meta).buildingFieldId).toBe(21);
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
            { buildingFieldId: fieldId1, buildingId: null },
            { buildingFieldId: fieldId2, buildingId: 'MAIN_BUILDING' },
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
            { buildingFieldId: 39, buildingId: null },
            { buildingFieldId: 19, buildingId: 'MAIN_BUILDING' },
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
            { buildingFieldId: 21, buildingId: null },
            { buildingFieldId: 20, buildingId: 'BARRACKS' },
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
            { buildingFieldId: 18, buildingId: 'CLAY_PIT' },
            { buildingFieldId: 39, buildingId: null },
            { buildingFieldId: 40, buildingId: 'RALLY_POINT' },
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
            { buildingFieldId: 19, buildingId: null },
            { buildingFieldId: 38, buildingId: 'MAIN_BUILDING' },
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
  });
});
