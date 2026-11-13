import type { Building } from '@pillage-first/types/models/building';
import type { DbFacade } from '@pillage-first/utils/facades/database';

// Only seed the building field; effect setup remains explicit in each scenario.
export const setTestBuildingLevel = (
  database: DbFacade,
  villageId: number,
  buildingId: Building['id'],
  level: number,
  fieldId = 20,
): void => {
  database.exec({
    sql: `
      INSERT INTO building_fields (village_id, field_id, building_id, level)
      SELECT $village_id, $field_id, id, $level FROM building_ids WHERE building = $building_id
      ON CONFLICT(village_id, field_id) DO UPDATE SET
        building_id = excluded.building_id, level = excluded.level;
    `,
    bind: {
      $village_id: villageId,
      $field_id: fieldId,
      $building_id: buildingId,
      $level: level,
    },
  });
};
