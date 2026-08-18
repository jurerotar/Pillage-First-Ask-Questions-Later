import { z } from 'zod';
import { calculateTotalUnitWheatConsumption } from '@pillage-first/game-assets/utils/troops';
import type { Troop } from '@pillage-first/types/models/troop';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { troopAmountSchema } from '../http/controllers/schemas/player-schemas';
import { updateWheatProductionByTroopsAndTileIdEffectQuery } from '../queries/effect-queries';
import { selectTroopAmountQuery } from '../queries/player-queries';
import { selectVillageIdByTileIdQuery } from '../queries/village-queries';
import { createEvents } from './create-event';
import { addTroops, removeTroops } from './troops';
import { updateResourceSiteResourcesAt } from './village';

export type ReinforcementTroopSelection = Pick<Troop, 'unitId' | 'amount'>;

export const moveTroopWheatConsumption = (
  database: DbFacade,
  troops: ReinforcementTroopSelection[],
  sourceTileId: number,
  targetTileId: number,
  timestamp: number,
) => {
  const troopsConsumption = calculateTotalUnitWheatConsumption(troops);

  updateResourceSiteResourcesAt(database, sourceTileId, timestamp);

  database.exec({
    sql: updateWheatProductionByTroopsAndTileIdEffectQuery,
    bind: {
      $tile_id: sourceTileId,
      $increase_amount: -troopsConsumption,
    },
  });

  updateResourceSiteResourcesAt(database, targetTileId, timestamp);

  database.exec({
    sql: updateWheatProductionByTroopsAndTileIdEffectQuery,
    bind: {
      $tile_id: targetTileId,
      $increase_amount: troopsConsumption,
    },
  });
};

const toTroops = ({
  troops,
  tileId,
  sourceTileId,
}: {
  troops: ReinforcementTroopSelection[];
  tileId: number;
  sourceTileId: number;
}): Troop[] =>
  troops.map((troop) => ({
    ...troop,
    tileId,
    sourceTileId,
  }));

const assertTroopsAvailable = (database: DbFacade, troops: Troop[]) => {
  if (troops.length === 1) {
    const troop = troops[0]!;
    const availableAmount = database.selectValue({
      sql: selectTroopAmountQuery,
      bind: {
        $unit_id: troop.unitId,
        $tile_id: troop.tileId,
        $source_tile_id: troop.sourceTileId,
      },
      schema: troopAmountSchema,
    });

    if ((availableAmount ?? 0) < troop.amount) {
      throw new Error('Not enough troops available');
    }
    return;
  }

  const hasUnavailableTroops = database.selectValue({
    sql: `
      WITH requested_troops AS (
        SELECT
          unit_ids.id AS unit_id,
          json_extract(troop.value, '$.tileId') AS tile_id,
          json_extract(troop.value, '$.sourceTileId') AS source_tile_id,
          SUM(json_extract(troop.value, '$.amount')) AS amount
        FROM
          json_each($troops) AS troop
          JOIN unit_ids
            ON unit_ids.unit = json_extract(troop.value, '$.unitId')
        GROUP BY unit_ids.id, tile_id, source_tile_id
      )
      SELECT EXISTS (
        SELECT 1
        FROM
          requested_troops
          LEFT JOIN troops
            ON troops.unit_id = requested_troops.unit_id
            AND troops.tile_id = requested_troops.tile_id
            AND troops.source_tile_id = requested_troops.source_tile_id
        GROUP BY
          requested_troops.unit_id,
          requested_troops.tile_id,
          requested_troops.source_tile_id,
          requested_troops.amount
        HAVING COALESCE(SUM(troops.amount), 0) < requested_troops.amount
      );
    `,
    bind: { $troops: JSON.stringify(troops) },
    schema: z.coerce.boolean(),
  })!;

  if (hasUnavailableTroops) {
    throw new Error('Not enough troops available');
  }
};

export const moveStationedTroops = (
  database: DbFacade,
  troops: ReinforcementTroopSelection[],
  source: Pick<Troop, 'tileId' | 'sourceTileId'>,
  target: Pick<Troop, 'tileId' | 'sourceTileId'>,
) => {
  const sourceTroops = toTroops({
    troops,
    tileId: source.tileId,
    sourceTileId: source.sourceTileId,
  });

  assertTroopsAvailable(database, sourceTroops);
  removeTroops(database, sourceTroops);
  addTroops(
    database,
    toTroops({
      troops,
      tileId: target.tileId,
      sourceTileId: target.sourceTileId,
    }),
  );
};

export const returnStationedTroops = (
  database: DbFacade,
  originTileId: number,
  targetTileId: number,
  homeTileId: number,
  troops: ReinforcementTroopSelection[],
  startsAt?: number,
) => {
  const selectedTroops = toTroops({
    troops,
    tileId: originTileId,
    sourceTileId: homeTileId,
  });

  assertTroopsAvailable(database, selectedTroops);
  removeTroops(database, selectedTroops);

  const eventVillageId = database.selectValue({
    sql: selectVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId },
    schema: z.number().nullable(),
  });

  if (eventVillageId == null) {
    throw new Error('Target village not found');
  }

  createEvents<'troopMovementReturn'>(database, {
    type: 'troopMovementReturn',
    villageId: eventVillageId,
    startsAt,
    originTileId,
    targetTileId,
    originalMovementType: 'troopMovementReturnReinforcements',
    troops: selectedTroops,
  });
};

export const removeStationedTroops = (
  database: DbFacade,
  troops: ReinforcementTroopSelection[],
  source: Pick<Troop, 'tileId' | 'sourceTileId'>,
) => {
  const selectedTroops = toTroops({
    troops,
    tileId: source.tileId,
    sourceTileId: source.sourceTileId,
  });

  assertTroopsAvailable(database, selectedTroops);
  removeTroops(database, selectedTroops);
};

export const hasHero = (troops: ReinforcementTroopSelection[]) => {
  return troops.some(({ unitId }) => unitId === 'HERO');
};
