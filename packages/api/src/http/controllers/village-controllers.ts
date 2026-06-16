import { z } from 'zod';
import { occupiableOasisDtoSchema } from '@pillage-first/types/dtos/oasis';
import { villageBySlugDtoSchema } from '@pillage-first/types/dtos/village';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import {
  createRearrangeSourceFieldsTableQuery,
  deleteRearrangedBuildingFieldsQuery,
  dropRearrangeSourceFieldsTableQuery,
  insertRearrangedBuildingFieldsQuery,
  selectOccupiableOasisInRangeQuery,
  selectVillageBySlugQuery,
  updateRearrangedBuildingFieldEventsQuery,
} from '../../queries/village-queries';
import { createController } from '../controller';
import {
  mapOccupiableOasisRowToDto,
  mapVillageBySlug,
} from './mappers/village-mapper';
import {
  getOccupiableOasisInRangeRowSchema,
  getVillageBySlugSchema,
} from './schemas/village-schemas';

export const getVillageBySlug = createController('/villages/:villageSlug', {
  summary: 'Get village by slug',
  requestParams: {
    path: z.strictObject({
      villageSlug: z.string(),
    }),
  },
  response: villageBySlugDtoSchema,
})(({ database, path: { villageSlug } }) => {
  const row = database.selectObject({
    sql: selectVillageBySlugQuery,
    bind: { $slug: villageSlug },
    schema: getVillageBySlugSchema,
  })!;

  return mapVillageBySlug(row);
});

export const getOccupiableOasisInRange = createController(
  '/villages/:villageId/occupiable-oasis',
  {
    summary: 'Get occupiable oasis in range',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(occupiableOasisDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectOccupiableOasisInRangeQuery,
    bind: {
      $village_id: villageId,
      $radius: 3,
    },
    schema: getOccupiableOasisInRangeRowSchema,
  });
  return rows.map(mapOccupiableOasisRowToDto);
});

export const rearrangeBuildingFields = createController(
  '/villages/:villageId/building-fields',
  'patch',
  {
    summary: 'Rearrange building fields',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    requestBody: z.array(
      z.strictObject({
        buildingFieldId: z.number(),
        buildingId: buildingIdSchema.nullable(),
      }),
    ),
  },
)(({ database, path: { villageId }, body: updates }) => {
  database.transaction(() => {
    database.exec({
      sql: dropRearrangeSourceFieldsTableQuery,
    });

    database.exec({
      sql: createRearrangeSourceFieldsTableQuery,
      bind: {
        $village_id: villageId,
      },
    });

    database.exec({
      sql: deleteRearrangedBuildingFieldsQuery,
      bind: {
        $village_id: villageId,
        $updates: JSON.stringify(updates),
      },
    });

    database.exec({
      sql: insertRearrangedBuildingFieldsQuery,
      bind: {
        $village_id: villageId,
        $updates: JSON.stringify(updates),
      },
    });

    database.exec({
      sql: dropRearrangeSourceFieldsTableQuery,
    });

    // 2. Update events
    // We only update events of types that have buildingFieldId and buildingId in meta
    database.exec({
      sql: updateRearrangedBuildingFieldEventsQuery,
      bind: {
        $village_id: villageId,
        $updates: JSON.stringify(updates),
      },
    });
  });
});
