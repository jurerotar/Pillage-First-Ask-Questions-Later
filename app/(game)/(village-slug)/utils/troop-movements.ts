import type { Village } from 'app/interfaces/models/game/village';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Effect } from 'app/interfaces/models/game/effect';
import { calculateDistanceBetweenPoints } from 'app/utils/common';
import { getUnitData } from 'app/(game)/(village-slug)/utils/units';
import { calculateComputedEffect } from 'app/(game)/utils/calculate-computed-effect';

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
    const { unitSpeed } = getUnitData(unitId);
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
