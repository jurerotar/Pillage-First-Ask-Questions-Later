import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const setTestWoundedTroopAmount = (
  database: DbFacade,
  villageId: number,
  unitId: UnitId,
  amount: number,
  updatedAt: number,
): void => {
  database.exec({
    sql: `DELETE FROM wounded_troops WHERE village_id = $village_id
      AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id);`,
    bind: { $village_id: villageId, $unit_id: unitId },
  });

  database.exec({
    sql: `INSERT INTO wounded_troops (village_id, unit_id, amount, updated_at)
      SELECT $village_id, id, $amount, $updated_at FROM unit_ids WHERE unit = $unit_id;`,
    bind: {
      $village_id: villageId,
      $unit_id: unitId,
      $amount: amount,
      $updated_at: updatedAt,
    },
  });
};

export const setTestIdleTroops = (
  database: DbFacade,
  unitId: UnitId,
  amount: number,
  tileId: number,
): void => {
  database.exec({
    sql: `DELETE FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)
      AND tile_id = $tile_id AND source_tile_id = $tile_id;`,
    bind: { $unit_id: unitId, $tile_id: tileId },
  });

  database.exec({
    sql: `INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
      SELECT id, $amount, $tile_id, $tile_id FROM unit_ids WHERE unit = $unit_id;`,
    bind: { $unit_id: unitId, $amount: amount, $tile_id: tileId },
  });
};
