import type { Troop, TroopModel } from 'app/interfaces/models/game/troop';

export const troopApiResource = (troopModel: TroopModel): Troop => {
  const { unit_id, amount, source, tile_id } = troopModel;

  return {
    unitId: unit_id,
    amount,
    tileId: tile_id,
    source,
  };
};
