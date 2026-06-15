import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop, TroopLike } from '@pillage-first/types/models/troop';
import { getUnitDefinition, getUnitsByTribeWithHero } from './units';

export const calculateTotalUnitWheatConsumption = (troops: TroopLike[]) => {
  let totalWheatConsumption = 0;

  for (const { unitId, amount } of troops) {
    const { unitWheatConsumption } = getUnitDefinition(unitId);
    totalWheatConsumption += unitWheatConsumption * amount;
  }

  return totalWheatConsumption;
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
