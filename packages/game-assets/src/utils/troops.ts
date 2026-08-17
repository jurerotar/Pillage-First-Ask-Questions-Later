import type { ResourceBundle } from '@pillage-first/types/models/resource';
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

export const calculateTotalCarryCapacity = (troops: TroopLike[]): number => {
  let totalCarryCapacity = 0;

  for (const { unitId, amount } of troops) {
    const { unitCarryCapacity } = getUnitDefinition(unitId);
    totalCarryCapacity += unitCarryCapacity * amount;
  }

  return totalCarryCapacity;
};

export const calculateLootableCarryCapacity = (
  availableResources: ResourceBundle,
  carryCapacity: number,
  crannyCapacity: number,
): number => {
  let totalAvailableResources = 0;

  for (const amount of availableResources) {
    totalAvailableResources += amount;
  }

  const totalLootableResources = Math.max(
    totalAvailableResources - crannyCapacity,
    0,
  );

  return Math.min(carryCapacity, totalLootableResources);
};

export const distributeLoot = (
  availableResources: ResourceBundle,
  carryCapacity: number,
): ResourceBundle => {
  const loot: ResourceBundle = [0, 0, 0, 0];
  const available: ResourceBundle = [
    availableResources[0],
    availableResources[1],
    availableResources[2],
    availableResources[3],
  ];

  let remainingCapacity = Math.max(0, carryCapacity);

  while (remainingCapacity > 0) {
    let availableResourceCount = 0;

    for (let index = 0; index < available.length; index += 1) {
      if (available[index] > 0) {
        availableResourceCount += 1;
      }
    }

    if (availableResourceCount === 0) {
      break;
    }

    const share = Math.max(
      1,
      Math.floor(remainingCapacity / availableResourceCount),
    );

    for (let index = 0; index < available.length; index += 1) {
      if (remainingCapacity <= 0) {
        break;
      }

      if (available[index] <= 0) {
        continue;
      }

      const amount = Math.min(available[index], share, remainingCapacity);
      loot[index] += amount;
      available[index] -= amount;
      remainingCapacity -= amount;
    }
  }

  return loot;
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
