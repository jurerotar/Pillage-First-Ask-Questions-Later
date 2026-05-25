import { z } from 'zod';
import type { Troop } from '@pillage-first/types/models/troop';
import { type UnitId, unitIdSchema } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export type StationedTroop = {
  unitId: UnitId;
  amount: number;
  source: number;
};

export const getDefendersAtTile = (
  database: DbFacade,
  tileId: number,
): StationedTroop[] => {
  return database.selectObjects({
    sql: `
      SELECT
        ui.unit AS unitId,
        t.amount,
        t.source_tile_id AS source
      FROM
        troops t
          JOIN unit_ids ui ON ui.id = t.unit_id
      WHERE
        t.tile_id = $tile_id;
    `,
    bind: { $tile_id: tileId },
    schema: z.strictObject({
      unitId: unitIdSchema,
      amount: z.number(),
      source: z.number(),
    }),
  });
};

export const addTroops = (database: DbFacade, troops: Troop[]) => {
  const stmt = database.prepare({
    sql: `
      INSERT INTO
        troops (unit_id, amount, tile_id, source_tile_id)
      VALUES
        ((
           SELECT id
           FROM
             unit_ids
           WHERE
             unit = $unit_id
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
        DELETE
        FROM
          troops
        WHERE
          unit_id = (
            SELECT id
            FROM unit_ids
            WHERE unit = $unit_id
            )
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
        SET
          amount = amount - $amount
        WHERE
          unit_id = (
            SELECT id
            FROM unit_ids
            WHERE unit = $unit_id
            )
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
