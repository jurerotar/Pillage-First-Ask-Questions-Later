import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import type { Server } from '@pillage-first/types/models/server';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';
import { getVillageSize } from '../utils/village-size';
import { buildingFieldsFactory } from './factories/building-fields-factory';

export const buildingFieldsSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  // villageId, fieldId, buildingId(id), level
  const results: number[][] = [];

  const buildingIdRows = database.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: z.strictObject({ id: z.number(), building: buildingIdSchema }),
  });

  const buildingIdMap = new Map<string, number>(
    buildingIdRows.map((b) => [b.building, b.id]),
  );

  const villages = database.selectObjects({
    sql: `
      SELECT
        v.id AS village_id,
        t.x,
        t.y,
        rfc.resource_field_composition AS resource_field_composition,
        ti.tribe,
        p.id AS player_id
      FROM
        villages v
          JOIN tiles t ON v.tile_id = t.id
          LEFT JOIN resource_field_composition_ids rfc ON t.resource_field_composition_id = rfc.id
          JOIN players p ON v.player_id = p.id
          JOIN tribe_ids ti ON p.tribe_id = ti.id;
    `,
    schema: z.strictObject({
      village_id: z.number(),
      x: z.number(),
      y: z.number(),
      resource_field_composition: resourceFieldCompositionSchema,
      tribe: tribeSchema,
      player_id: z.number(),
    }),
  });

  for (const {
    player_id,
    resource_field_composition,
    tribe,
    village_id,
    x,
    y,
  } of villages) {
    if (player_id === PLAYER_ID) {
      const buildingFieldsWithoutVillageId = buildingFieldsFactory(
        'player',
        tribe,
        resource_field_composition,
      );
      const buildingFields = buildingFieldsWithoutVillageId.map(
        ({ field_id, building_id, level }) => [
          village_id,
          field_id,
          buildingIdMap.get(building_id)!,
          level,
        ],
      );
      results.push(...buildingFields);
      continue;
    }

    const villageSize = getVillageSize(server.configuration.mapSize, x, y);
    const buildingFieldsWithoutVillageId = buildingFieldsFactory(
      villageSize,
      tribe,
      resource_field_composition,
    );
    const buildingFields = buildingFieldsWithoutVillageId.map(
      ({ field_id, building_id, level }) => [
        village_id,
        field_id,
        buildingIdMap.get(building_id)!,
        level,
      ],
    );
    results.push(...buildingFields);
  }

  batchInsert(
    database,
    'building_fields',
    ['village_id', 'field_id', 'building_id', 'level'],
    results,
  );
};
