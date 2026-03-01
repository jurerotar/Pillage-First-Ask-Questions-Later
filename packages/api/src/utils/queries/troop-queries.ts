import type { Troop } from '@pillage-first/types/models/troop';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const addTroops = (database: DbFacade, troops: Troop[]) => {
  const stmt = database.prepare({
    sql: `
      INSERT INTO
        troops (unit_id, amount, tile_id, source_tile_id)
      VALUES
        ((
           SELECT id
           FROM unit_ids
           WHERE unit = $unit_id
           ), $amount, $tile_id, $source_tile_id)
      ON CONFLICT (unit_id, tile_id, source_tile_id) DO UPDATE SET
        amount = troops.amount + EXCLUDED.amount;
    `,
  });

  for (const troop of troops) {
    stmt
      .bind({
        $unit_id: troop.unitId,
        $amount: troop.amount,
        $tile_id: troop.tileId,
        $source_tile_id: troop.source,
      })
      .stepReset();
  }
};

export const removeTroops = (database: DbFacade, troops: Troop[]) => {
  for (const troop of troops) {
    database.exec({
      sql: `
        DELETE FROM troops
        WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)
          AND tile_id = $tile_id
          AND source_tile_id = $source_tile_id
          AND amount <= $amount;
      `,
      bind: {
        $unit_id: troop.unitId,
        $amount: troop.amount,
        $tile_id: troop.tileId,
        $source_tile_id: troop.source,
      },
    });

    database.exec({
      sql: `
        UPDATE troops
        SET amount = amount - $amount
        WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)
          AND tile_id = $tile_id
          AND source_tile_id = $source_tile_id
          AND amount > $amount;
      `,
      bind: {
        $unit_id: troop.unitId,
        $amount: troop.amount,
        $tile_id: troop.tileId,
        $source_tile_id: troop.source,
      },
    });
  }
};
