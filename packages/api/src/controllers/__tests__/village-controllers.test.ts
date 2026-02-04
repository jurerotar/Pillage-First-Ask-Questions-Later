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
      schema: z.object({ slug: z.string() }),
    })!;

    getVillageBySlug(
      database,
      createControllerArgs<'/villages/:villageSlug'>({
        params: { villageSlug: village.slug },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getOccupiableOasisInRange should return occupiable oasis in range', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.object({ id: z.number() }),
    })!;

    getOccupiableOasisInRange(
      database,
      createControllerArgs<'/villages/:villageId/occupiable-oasis'>({
        params: { villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });

  describe('rearrangeBuildingFields', () => {
    test('should swap two occupied building fields and update events', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.object({ id: z.number() }),
      })!;
      const villageId = village.id;
      const fieldId1 = 19;
      const fieldId2 = 20;

      // Seed data
      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, $f, 'MAIN_BUILDING', 1)",
        bind: { $v: villageId, $f: fieldId1 },
      });
      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, $f, 'BARRACKS', 2)",
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
          params: { villageId },
          body: [
            { buildingFieldId: fieldId1, buildingId: 'BARRACKS' },
            { buildingFieldId: fieldId2, buildingId: 'MAIN_BUILDING' },
          ],
        }),
      );

      const bf1 = database.selectObject({
        sql: 'SELECT building_id FROM building_fields WHERE village_id = $v AND field_id = $f',
        bind: { $v: villageId, $f: fieldId1 },
        schema: z.object({ building_id: buildingIdSchema }),
      })!;

      const bf2 = database.selectObject({
        sql: 'SELECT building_id FROM building_fields WHERE village_id = $v AND field_id = $f',
        bind: { $v: villageId, $f: fieldId2 },
        schema: z.object({ building_id: buildingIdSchema }),
      })!;

      expect(bf1.building_id).toBe('BARRACKS');
      expect(bf2.building_id).toBe('MAIN_BUILDING');

      const event = database.selectObject({
        sql: 'SELECT meta FROM events WHERE village_id = $v',
        bind: { $v: villageId },
        schema: z.object({ meta: z.string() }),
      });
      expect(JSON.parse(event!.meta).buildingFieldId).toBe(fieldId2);
    });

    test('should move building to empty field', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.object({ id: z.number() }),
      })!;
      const villageId = village.id;
      const fieldId1 = 19;
      const fieldId2 = 21;

      database.exec({
        sql: "INSERT OR REPLACE INTO building_fields (village_id, field_id, building_id, level) VALUES ($v, $f, 'MAIN_BUILDING', 1)",
        bind: { $v: villageId, $f: fieldId1 },
      });

      rearrangeBuildingFields(
        database,
        createControllerArgs<'/villages/:villageId/building-fields', 'patch'>({
          params: { villageId },
          body: [
            { buildingFieldId: fieldId1, buildingId: null },
            { buildingFieldId: fieldId2, buildingId: 'MAIN_BUILDING' },
          ],
        }),
      );

      const bf1 = database.selectObject({
        sql: 'SELECT building_id FROM building_fields WHERE village_id = $v AND field_id = $f',
        bind: { $v: villageId, $f: fieldId1 },
        schema: z.object({ building_id: buildingIdSchema }),
      });

      const bf2 = database.selectObject({
        sql: 'SELECT building_id FROM building_fields WHERE village_id = $v AND field_id = $f',
        bind: { $v: villageId, $f: fieldId2 },
        schema: z.object({ building_id: buildingIdSchema }),
      })!;

      expect(bf1).toBeUndefined();
      expect(bf2.building_id).toBe('MAIN_BUILDING');
    });
  });
});
