import type { Troop } from '@pillage-first/types/models/troop';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const selectHeroOriginVillageIdQuery = `
  SELECT
    v.id
  FROM
    troops tr
      JOIN villages v ON tr.source_tile_id = v.tile_id
      JOIN unit_ids ui ON ui.id = tr.unit_id
  WHERE
    ui.unit = 'HERO'
    AND v.player_id = $playerId;
`;

export const addTroops = (database: DbFacade, troops: Troop[]) => {
  const stmt = database.prepare({
    sql: `
      INSERT INTO
        troops (unit_id, amount, tile_id, source_tile_id)
      VALUES
        ((
           SELECT id
           FROM unit_ids
           WHERE unit = $unitId
           ), $amount, $tileId, $sourceTileId)
      ON CONFLICT (unit_id, tile_id, source_tile_id) DO UPDATE SET
        amount = troops.amount + EXCLUDED.amount;
    `,
  });

  for (const troop of troops) {
    stmt
      .bind({
        $unitId: troop.unitId,
        $amount: troop.amount,
        $tileId: troop.tileId,
        $sourceTileId: troop.source,
      })
      .stepReset();
  }
};

export const removeTroops = (database: DbFacade, troops: Troop[]) => {
  for (const troop of troops) {
    database.exec({
      sql: `
        DELETE FROM troops
        WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)
          AND tile_id = $tileId
          AND source_tile_id = $sourceTileId
          AND amount <= $amount;
      `,
      bind: {
        $unitId: troop.unitId,
        $amount: troop.amount,
        $tileId: troop.tileId,
        $sourceTileId: troop.source,
      },
    });

    database.exec({
      sql: `
        UPDATE troops
        SET amount = amount - $amount
        WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)
          AND tile_id = $tileId
          AND source_tile_id = $sourceTileId
          AND amount > $amount;
      `,
      bind: {
        $unitId: troop.unitId,
        $amount: troop.amount,
        $tileId: troop.tileId,
        $sourceTileId: troop.source,
      },
    });
  }
};
