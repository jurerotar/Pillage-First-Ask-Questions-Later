import { z } from 'zod';
import {
  buildingLevelChangeHistoryItemDtoSchema,
  eventsHistoryItemDtoSchema,
  unitTrainingHistoryItemDtoSchema,
} from '@pillage-first/types/dtos/history';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import {
  selectBuildingLevelChangeHistoryQuery,
  selectUnitTrainingHistoryQuery,
} from '../../queries/history-queries';
import { createController } from '../controller';
import {
  mapBuildingLevelChangeHistoryRowToDto,
  mapUnitTrainingHistoryRowToDto,
} from './mappers/history-mapper';
import {
  getBuildingLevelChangeHistoryRowSchema,
  getEventsHistorySchema,
  getUnitTrainingHistoryRowSchema,
} from './schemas/history-schemas';

export const getBuildingLevelChangeHistory = createController(
  '/villages/:villageId/history/buildings',
  {
    summary: 'Get village building level change history',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(buildingLevelChangeHistoryItemDtoSchema),
  },
)(({ database, path }) => {
  const { villageId } = path;

  const rows = database.selectObjects({
    sql: selectBuildingLevelChangeHistoryQuery,
    bind: {
      $village_id: villageId,
    },
    schema: getBuildingLevelChangeHistoryRowSchema,
  });

  return rows.map(mapBuildingLevelChangeHistoryRowToDto);
});

export const getUnitTrainingHistory = createController(
  '/villages/:villageId/history/units',
  {
    summary: 'Get village unit training history',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
      query: z.strictObject({
        buildingId: buildingIdSchema.nullable().optional(),
      }),
    },
    response: z.array(unitTrainingHistoryItemDtoSchema),
  },
)(({ database, path, query }) => {
  const { villageId } = path;
  const { buildingId = null } = query;

  const rows = database.selectObjects({
    sql: selectUnitTrainingHistoryQuery,
    bind: {
      $village_id: villageId,
      $building_id: buildingId,
    },
    schema: getUnitTrainingHistoryRowSchema,
  });

  return rows.map(mapUnitTrainingHistoryRowToDto);
});

export const getEventsHistory = createController(
  '/villages/:villageId/history/events',
  {
    summary: 'Get village events history',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
      query: z.strictObject({
        page: z.coerce.number().optional().default(1),
        scope: z.enum(['village', 'global']).optional().default('village'),
        types: z
          .array(
            z.enum([
              'construction',
              'training',
              'improvement',
              'research',
              'founding',
            ]),
          )
          .or(
            z.enum([
              'construction',
              'training',
              'improvement',
              'research',
              'founding',
            ]),
          )
          .optional(),
      }),
    },
    response: z.array(eventsHistoryItemDtoSchema),
  },
)(({ database, path, url }) => {
  const { villageId } = path;
  const { searchParams } = new URL(url, 'http://localhost');
  const scope = searchParams.get('scope') ?? 'village';
  const types = searchParams.getAll('types');

  const villageFilter =
    scope === 'village'
      ? 'WHERE village_id = $village_id'
      : 'WHERE village_id IN (SELECT id FROM villages WHERE player_id = (SELECT player_id FROM villages WHERE id = $village_id))';

  const queries = [];

  if (types.length === 0 || types.includes('construction')) {
    queries.push(`
      SELECT
        'construction-' || id AS id,
        village_id AS villageId,
        'construction' AS type,
        timestamp,
        json_object(
          'fieldId', field_id,
          'building', (SELECT building FROM building_ids WHERE id = building_id),
          'previousLevel', previous_level,
          'newLevel', new_level
        ) AS data
      FROM building_level_change_history
      ${villageFilter}
    `);
  }

  if (types.length === 0 || types.includes('training')) {
    queries.push(`
      SELECT
        'training-' || id AS id,
        village_id AS villageId,
        'training' AS type,
        timestamp,
        json_object(
          'batchId', batch_id,
          'unit', (SELECT unit FROM unit_ids WHERE id = unit_id),
          'building', (SELECT building FROM building_ids WHERE id = building_id),
          'amount', amount
        ) AS data
      FROM unit_training_history
      ${villageFilter}
    `);
  }

  if (types.length === 0 || types.includes('improvement')) {
    queries.push(`
      SELECT
        'improvement-' || id AS id,
        (SELECT id FROM villages WHERE player_id = unit_improvement_history.player_id LIMIT 1) AS villageId,
        'improvement' AS type,
        timestamp,
        json_object(
          'unit', (SELECT unit FROM unit_ids WHERE id = unit_id),
          'previousLevel', previous_level,
          'newLevel', new_level
        ) AS data
      FROM unit_improvement_history
      WHERE player_id = (SELECT player_id FROM villages WHERE id = $village_id)
    `);
  }

  if (types.length === 0 || types.includes('research')) {
    queries.push(`
      SELECT
        'research-' || id AS id,
        village_id AS villageId,
        'research' AS type,
        timestamp,
        json_object(
          'unit', (SELECT unit FROM unit_ids WHERE id = unit_id)
        ) AS data
      FROM unit_research_history
      ${villageFilter}
    `);
  }

  if (types.length === 0 || types.includes('founding')) {
    queries.push(`
      SELECT
        'founding-' || id AS id,
        village_id AS villageId,
        'founding' AS type,
        timestamp,
        json_object(
          'tileId', tile_id,
          'x', x,
          'y', y
        ) AS data
      FROM village_founding_history
      ${villageFilter}
    `);
  }

  const sql = `
    SELECT * FROM (
      ${queries.join(' UNION ALL ')}
    )
    ORDER BY timestamp DESC
  `;

  return database.selectObjects({
    sql,
    bind: {
      $village_id: villageId,
    },
    schema: getEventsHistorySchema,
  });
});
