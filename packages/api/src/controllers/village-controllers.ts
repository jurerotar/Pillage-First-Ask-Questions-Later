import { createController } from '../http/controller';
import {
  mapOccupiableOasisRowToDto,
  mapVillageBySlug,
} from '../mappers/village-mapper';
import {
  createRearrangeSourceFieldsTableQuery,
  deleteRearrangedBuildingFieldsQuery,
  dropRearrangeSourceFieldsTableQuery,
  insertRearrangedBuildingFieldsQuery,
  selectOccupiableOasisInRangeQuery,
  selectVillageBySlugQuery,
  updateRearrangedBuildingFieldEventsQuery,
} from '../queries/village-queries';
import {
  getOccupiableOasisInRangeRowSchema,
  getVillageBySlugSchema,
} from '../schemas/village-schemas';

export const getVillageBySlug = createController('/villages/:villageSlug')(
  ({ database, path: { villageSlug } }) => {
    const row = database.selectObject({
      sql: selectVillageBySlugQuery,
      bind: { $slug: villageSlug },
      schema: getVillageBySlugSchema,
    })!;

    return mapVillageBySlug(row);
  },
);

export const getOccupiableOasisInRange = createController(
  '/villages/:villageId/occupiable-oasis',
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
