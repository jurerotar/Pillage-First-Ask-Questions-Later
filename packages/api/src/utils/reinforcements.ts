import type { Troop } from '@pillage-first/types/models/troop';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  coordinatesRowSchema,
  troopAmountSchema,
} from '../http/controllers/schemas/player-schemas';
import {
  selectTileCoordinatesQuery,
  selectTroopAmountQuery,
} from '../queries/player-queries';
import { createEvents } from './create-event';
import { addTroops, removeTroops } from './troops';

export type ReinforcementTroopSelection = Pick<Troop, 'unitId' | 'amount'>;

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
    originCoordinates: database.selectObject({
      sql: selectTileCoordinatesQuery,
      bind: { $tile_id: originTileId },
      schema: coordinatesRowSchema,
    })!,
    targetCoordinates: database.selectObject({
      sql: selectTileCoordinatesQuery,
      bind: { $tile_id: targetTileId },
      schema: coordinatesRowSchema,
    })!,
    originalMovementType: 'troopMovementReturnReinforcements',
    troops: selectedTroops,
  });
};

export const hasHero = (troops: ReinforcementTroopSelection[]) => {
  return troops.some(({ unitId }) => unitId === 'HERO');
};
