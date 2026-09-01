import { z } from 'zod';
import {
  buildingLevelChangeHistoryItemDtoSchema,
  eventsHistoryItemDtoSchema,
  unitTrainingHistoryItemDtoSchema,
} from '@pillage-first/types/dtos/history';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import {
  selectBuildingLevelChangeHistoryQuery,
  selectEventsHistoryQuery,
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

  return database.selectObjects({
    sql: selectEventsHistoryQuery,
    bind: {
      $village_id: villageId,
      $scope: scope,
      $types: JSON.stringify(types),
    },
    schema: getEventsHistorySchema,
  });
});
