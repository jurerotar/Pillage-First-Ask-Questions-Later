import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop, TroopLike } from '@pillage-first/types/models/troop';
import { units } from '../units';
import { getUnitDefinition, getUnitsByTribeWithHero } from './units';

export const calculateTotalUnitWheatConsumption = (troops: TroopLike[]) => {
  let totalWheatConsumption = 0;

  for (const { unitId, amount } of troops) {
    const { unitWheatConsumption } = getUnitDefinition(unitId);
    totalWheatConsumption += unitWheatConsumption * amount;
  }

  return totalWheatConsumption;
};

export const calculateTotalCarryCapacity = (troops: TroopLike[]): number => {
  let totalCarryCapacity = 0;

  for (const { unitId, amount } of troops) {
    const { unitCarryCapacity } = getUnitDefinition(unitId);
    totalCarryCapacity += unitCarryCapacity * amount;
  }

  return totalCarryCapacity;
};

export const sortTroops = (tribe: Tribe, troops: TroopLike[]): TroopLike[] => {
  const amountByUnitId = new Map<Troop['unitId'], number>();

  for (const { unitId, amount } of troops) {
    amountByUnitId.set(unitId, (amountByUnitId.get(unitId) ?? 0) + amount);
  }

  const unitIds: Troop['unitId'][] = getUnitsByTribeWithHero(tribe).map(
    ({ id }) => id,
  );

  return unitIds.map((unitId) => ({
    unitId,
    amount: amountByUnitId.get(unitId) ?? 0,
  }));
};

const unitOrder = new Map<Troop['unitId'], number>(
  units.map(({ id }, index) => [id, index] as const),
);

export const sortTroopsByUnitOrder = <T extends TroopLike>(
  troops: T[],
): T[] => {
  return troops.toSorted((troopA, troopB) => {
    const unitOrderA = unitOrder.get(troopA.unitId)!;
    const unitOrderB = unitOrder.get(troopB.unitId)!;

    return unitOrderA - unitOrderB;
  });
};
