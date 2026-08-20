import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type { Effect } from '@pillage-first/types/models/effect';
import type { Tile } from '@pillage-first/types/models/tile';
import type { Troop } from '@pillage-first/types/models/troop';
import { tileIdToCoordinates } from '../map';
import { calculateDistanceBetweenPoints } from '../math';
import { calculateComputedEffect } from './calculate-computed-effect';

type CalculateTravelDurationArgs = {
  originTileId: Tile['id'];
  targetTileId: Tile['id'];
  mapSize: number;
  troops: Troop[];
  effects: Effect[];
};

export const calculateTravelDuration = (args: CalculateTravelDurationArgs) => {
  const { originTileId, targetTileId, mapSize, troops, effects } = args;

  const distance = calculateDistanceBetweenPoints(
    tileIdToCoordinates(originTileId, mapSize),
    tileIdToCoordinates(targetTileId, mapSize),
  );

  const unitSpeeds = troops.map(({ unitId }) => {
    const { unitSpeed } = getUnitDefinition(unitId);
    return unitSpeed;
  });

  // Tiles/h
  const speedOfSlowestUnit = Math.min(...unitSpeeds);

  const { total: unitSpeedBonus } = calculateComputedEffect(
    'unitSpeed',
    effects,
    originTileId,
  );

  const computedSpeed = speedOfSlowestUnit * unitSpeedBonus;

  // There's a separate effect that applies for distances over 20 fields
  if (distance <= 20) {
    return (distance / computedSpeed) * 3_600_000;
  }

  const remainingDistanceAfter20Fields = distance - 20;
  const timeToCross20Fields = 20 / computedSpeed;

  const { total: unitSpeedAfter20FieldsBonus } = calculateComputedEffect(
    'unitSpeedAfter20Fields',
    effects,
    originTileId,
  );

  const timeToCrossRemainingFields =
    remainingDistanceAfter20Fields /
    (computedSpeed * unitSpeedAfter20FieldsBonus);

  return (timeToCross20Fields + timeToCrossRemainingFields) * 3_600_000;
};
