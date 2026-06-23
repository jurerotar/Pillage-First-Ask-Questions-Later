import { calculateTotalUnitWheatConsumption } from '@pillage-first/game-assets/utils/troops';
import type { Troop } from '@pillage-first/types/models/troop';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { troopAmountSchema } from '../http/controllers/schemas/player-schemas';
import { updateVillageWheatProductionByTroopsAndVillageIdEffectQuery } from '../queries/effect-queries';
import { selectTroopAmountQuery } from '../queries/player-queries';
import { createEvents } from './create-event';
import { addTroops, removeTroops } from './troops';
import { updateVillageResourcesAt } from './village';

export type ReinforcementTroopSelection = Pick<Troop, 'unitId' | 'amount'>;

export const moveTroopWheatConsumption = (
  database: DbFacade,
  troops: ReinforcementTroopSelection[],
  sourceVillageId: number,
  targetVillageId: number,
  timestamp: number,
) => {
  const troopsConsumption = calculateTotalUnitWheatConsumption(troops);

  updateVillageResourcesAt(database, sourceVillageId, timestamp);

  database.exec({
    sql: updateVillageWheatProductionByTroopsAndVillageIdEffectQuery,
    bind: {
      $village_id: sourceVillageId,
      $increase_amount: -troopsConsumption,
    },
  });

  updateVillageResourcesAt(database, targetVillageId, timestamp);

  database.exec({
    sql: updateVillageWheatProductionByTroopsAndVillageIdEffectQuery,
    bind: {
      $village_id: targetVillageId,
      $increase_amount: troopsConsumption,
    },
  });
};

const toTroops = ({
  troops,
  tileId,
  source,
}: {
  troops: ReinforcementTroopSelection[];
  tileId: number;
  source: number;
}): Troop[] =>
  troops.map((troop) => ({
    ...troop,
    tileId,
    source,
  }));

const assertTroopsAvailable = (database: DbFacade, troops: Troop[]) => {
  for (const troop of troops) {
    const availableAmount = database.selectValue({
      sql: selectTroopAmountQuery,
      bind: {
        $unit_id: troop.unitId,
        $tile_id: troop.tileId,
        $source_tile_id: troop.source,
      },
      schema: troopAmountSchema,
    });

    if ((availableAmount ?? 0) < troop.amount) {
      throw new Error('Not enough troops available');
    }
  }
};

export const moveStationedTroops = (
  database: DbFacade,
  troops: ReinforcementTroopSelection[],
  source: Pick<Troop, 'tileId' | 'source'>,
  target: Pick<Troop, 'tileId' | 'source'>,
) => {
  const sourceTroops = toTroops({
    troops,
    tileId: source.tileId,
    source: source.source,
  });

  assertTroopsAvailable(database, sourceTroops);
  removeTroops(database, sourceTroops);
  addTroops(
    database,
    toTroops({
      troops,
      tileId: target.tileId,
      source: target.source,
    }),
  );
};

export const returnStationedTroops = (
  database: DbFacade,
  eventVillageId: number,
  originTileId: number,
  targetTileId: number,
  homeTileId: number,
  troops: ReinforcementTroopSelection[],
  startsAt?: number,
) => {
  const selectedTroops = toTroops({
    troops,
    tileId: originTileId,
    source: homeTileId,
  });

  assertTroopsAvailable(database, selectedTroops);
  removeTroops(database, selectedTroops);

  createEvents<'troopMovementReturn'>(database, {
    type: 'troopMovementReturn',
    villageId: eventVillageId,
    startsAt,
    originTileId,
    targetTileId,
    originalMovementType: 'troopMovementReturnReinforcements',
    troops: selectedTroops,
    loot: [0, 0, 0, 0],
  });
};

export const removeStationedTroops = (
  database: DbFacade,
  troops: ReinforcementTroopSelection[],
  source: Pick<Troop, 'tileId' | 'source'>,
) => {
  const selectedTroops = toTroops({
    troops,
    tileId: source.tileId,
    source: source.source,
  });

  assertTroopsAvailable(database, selectedTroops);
  removeTroops(database, selectedTroops);
};

export const hasHero = (troops: ReinforcementTroopSelection[]) => {
  return troops.some(({ unitId }) => unitId === 'HERO');
};
