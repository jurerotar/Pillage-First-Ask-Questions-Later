import { z } from 'zod';
import type { Tile } from '@pillage-first/types/models/tile';
import type { Troop } from '@pillage-first/types/models/troop';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { relocateHero } from '../resolvers/utils/hero';
import { createEvents } from './create-event';

export const decrementReinforcementsFromVillage = (
  db: DbFacade,
  currentVillageTile: Tile['id'],
  sourceTileId: Tile['id'],
  troops: Omit<Troop, 'source' | 'tileId'>[],
) => {
  if (troops.length === 0) {
    return;
  }

  const aggregatedTroops = Array.from(
    troops.reduce((requestedTroops, { unitId, amount }) => {
      requestedTroops.set(unitId, (requestedTroops.get(unitId) ?? 0) + amount);

      return requestedTroops;
    }, new Map<Troop['unitId'], number>()),
    ([unitId, amount]) => ({ unitId, amount }),
  );

  const requestedValuesSql = aggregatedTroops
    .map((_, index) => `($unit_id_${index}, $amount_${index})`)
    .join(',\n          ');

  const requestedTroopsSql = `
    WITH
      requested_troops(unit_id, amount) AS (
        VALUES
          ${requestedValuesSql}
        ),
      requested_troops_with_ids AS (
        SELECT
          ui.id AS db_unit_id,
          rt.unit_id,
          rt.amount
        FROM
          requested_troops rt
            JOIN unit_ids ui ON ui.unit = rt.unit_id
        )
  `;
  const bind: Record<string, number | string> = {
    $tile_id: currentVillageTile,
    $source_tile_id: sourceTileId,
  };

  for (const [index, { unitId, amount }] of aggregatedTroops.entries()) {
    bind[`$unit_id_${index}`] = unitId;
    bind[`$amount_${index}`] = amount;
  }

  const unavailableTroops = db.selectValues({
    sql: `
      ${requestedTroopsSql}
      SELECT rtwi.unit_id
      FROM
        requested_troops_with_ids rtwi
          LEFT JOIN troops t
                    ON t.unit_id = rtwi.db_unit_id
                      AND t.tile_id = $tile_id
                      AND t.source_tile_id = $source_tile_id
      WHERE
        t.amount IS NULL
        OR t.amount < rtwi.amount
    `,
    bind,
    schema: z.string(),
  });

  if (unavailableTroops.length > 0) {
    throw new Error('Not enough troops available for relocation');
  }

  db.exec({
    sql: `
      ${requestedTroopsSql}
      DELETE
      FROM
        troops
      WHERE
        tile_id = $tile_id
        AND source_tile_id = $source_tile_id
        AND EXISTS
        (
          SELECT 1
          FROM
            requested_troops_with_ids rtwi
          WHERE
            rtwi.db_unit_id = troops.unit_id
            AND troops.amount = rtwi.amount
          )
    `,
    bind,
  });

  db.exec({
    sql: `
      ${requestedTroopsSql}
      UPDATE troops
      SET
        amount = amount - (
          SELECT rtwi.amount
          FROM
            requested_troops_with_ids rtwi
          WHERE
            rtwi.db_unit_id = troops.unit_id
          )
      WHERE
        tile_id = $tile_id
        AND source_tile_id = $source_tile_id
        AND EXISTS
        (
          SELECT 1
          FROM
            requested_troops_with_ids rtwi
          WHERE
            rtwi.db_unit_id = troops.unit_id
            AND troops.amount > rtwi.amount
          )
    `,
    bind,
  });
};

const addVillageTroops = (
  db: DbFacade,
  tileId: Tile['id'],
  sourceTileId: Tile['id'],
  troops: Omit<Troop, 'source' | 'tileId'>[],
) => {
  for (const troop of troops) {
    db.exec({
      sql: `
        INSERT INTO
          troops (tile_id, source_tile_id, unit_id, amount)
        VALUES
          ($tile_id, $source_tile_id, (
            SELECT id
            FROM
              unit_ids
            WHERE
              unit = $unit_id
            ), $amount)
        ON CONFLICT (tile_id, source_tile_id, unit_id)
          DO UPDATE
          SET
            amount = amount + $amount
      `,
      bind: {
        $tile_id: tileId,
        $source_tile_id: sourceTileId,
        $unit_id: troop.unitId,
        $amount: troop.amount,
      },
    });
  }
};

const createMovementTroops = (
  troops: Omit<Troop, 'source' | 'tileId'>[],
  homeTileId: Tile['id'],
) => {
  return troops.map((troop) => ({
    ...troop,
    source: homeTileId,
    tileId: homeTileId,
  }));
};

export const handleReturnReinforcements = ({
  db,
  originTileId,
  targetTileId,
  homeTileId,
  eventVillageId,
  troops,
}: {
  db: DbFacade;
  originTileId: Tile['id'];
  targetTileId: Tile['id'];
  homeTileId: Tile['id'];
  eventVillageId: number;
  troops: Omit<Troop, 'source' | 'tileId'>[];
}) => {
  const { originVillageX, originVillageY, targetVillageX, targetVillageY } =
    db.selectObject({
      sql: `
      SELECT
        ot.x AS originVillageX,
        ot.y AS originVillageY,
        tt.x AS targetVillageX,
        tt.y AS targetVillageY
      FROM tiles ot
        LEFT JOIN tiles tt ON tt.id = $target_tile_id
      WHERE ot.id = $origin_tile_id
    `,
      bind: {
        $origin_tile_id: originTileId,
        $target_tile_id: targetTileId,
      },
      schema: z.strictObject({
        originVillageX: z.number().nullable(),
        originVillageY: z.number().nullable(),
        targetVillageX: z.number().nullable(),
        targetVillageY: z.number().nullable(),
      }),
    })!;

  if (originVillageX === null || originVillageY === null) {
    throw new Error('Origin village tile not found');
  }

  if (targetVillageX === null || targetVillageY === null) {
    throw new Error('Target village tile not found');
  }

  decrementReinforcementsFromVillage(db, originTileId, homeTileId, troops);

  createEvents<'troopMovementReturn'>(db, {
    type: 'troopMovementReturn',
    villageId: eventVillageId,
    originalMovementType: 'troopMovementReturnReinforcements',
    troops: createMovementTroops(troops, homeTileId),
    startsAt: Date.now(),
    originCoordinates: {
      x: originVillageX,
      y: originVillageY,
    },
    targetCoordinates: {
      x: targetVillageX,
      y: targetVillageY,
    },
  });
};

export const handleRelocateReinforcements = ({
  db,
  villageId,
  stationedTileId,
  homeTileId,
  targetTileId,
  relocateHeroFromVillageId,
  troops,
}: {
  db: DbFacade;
  villageId: number;
  stationedTileId: Tile['id'];
  homeTileId: Tile['id'];
  targetTileId: Tile['id'];
  troops: Omit<Troop, 'source' | 'tileId'>[];
  relocateHeroFromVillageId?: number;
}) => {
  const {
    currentVillageTile,
    stationedVillageX,
    stationedVillageY,
    targetVillageX,
    targetVillageY,
  } = db.selectObject({
    sql: `
      SELECT
        cv.tile_id AS currentVillageTile,
        st.x AS stationedVillageX,
        st.y AS stationedVillageY,
        tt.x AS targetVillageX,
        tt.y AS targetVillageY
      FROM villages cv
        LEFT JOIN tiles st ON st.id = $stationed_tile_id
        LEFT JOIN tiles tt ON tt.id = $target_tile_id
      WHERE cv.id = $village_id
    `,
    bind: {
      $stationed_tile_id: stationedTileId,
      $target_tile_id: targetTileId,
      $village_id: villageId,
    },
    schema: z.strictObject({
      currentVillageTile: z.number(),
      stationedVillageX: z.number().nullable(),
      stationedVillageY: z.number().nullable(),
      targetVillageX: z.number().nullable(),
      targetVillageY: z.number().nullable(),
    }),
  })!;

  if (targetVillageX === null || targetVillageY === null) {
    throw new Error('Target village tile not found');
  }

  if (stationedVillageX === null || stationedVillageY === null) {
    throw new Error('Stationed village tile not found');
  }

  decrementReinforcementsFromVillage(db, stationedTileId, homeTileId, troops);

  if (targetTileId === currentVillageTile) {
    addVillageTroops(db, currentVillageTile, currentVillageTile, troops);

    if (
      relocateHeroFromVillageId !== undefined &&
      troops.some(({ unitId }) => unitId === 'HERO')
    ) {
      relocateHero(db, relocateHeroFromVillageId, villageId, Date.now());
    }

    return;
  }

  if (targetTileId === stationedTileId) {
    throw new Error('Target village must differ from stationed village');
  }

  createEvents<'troopMovementReinforcements'>(db, {
    type: 'troopMovementReinforcements',
    villageId,
    troops: createMovementTroops(troops, homeTileId),
    startsAt: Date.now(),
    originCoordinates: {
      x: stationedVillageX,
      y: stationedVillageY,
    },
    targetCoordinates: {
      x: targetVillageX,
      y: targetVillageY,
    },
  });
};
