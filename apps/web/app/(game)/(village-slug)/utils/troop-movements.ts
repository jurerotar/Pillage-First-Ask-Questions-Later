import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type { Effect } from '@pillage-first/types/models/effect';
import type { Troop } from '@pillage-first/types/models/troop';
import type { Village } from '@pillage-first/types/models/village';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import { calculateDistanceBetweenPoints } from '@pillage-first/utils/math';

type CalculateTravelDurationArgs = {
  originVillageId: Village['id'];
  originCoordinates: Village['coordinates'];
  targetCoordinates: Village['coordinates'];
  troops: Troop[];
  effects: Effect[];
};

export const calculateTravelDuration = (args: CalculateTravelDurationArgs) => {
  const {
    originVillageId,
    originCoordinates,
    targetCoordinates,
    troops,
    effects,
  } = args;

  const distance = calculateDistanceBetweenPoints(
    originCoordinates,
    targetCoordinates,
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
    originVillageId,
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
    originVillageId,
  );

  const timeToCrossRemainingFields =
    remainingDistanceAfter20Fields /
    (computedSpeed * unitSpeedAfter20FieldsBonus);

  return (timeToCross20Fields + timeToCrossRemainingFields) * 3_600_000;
};
