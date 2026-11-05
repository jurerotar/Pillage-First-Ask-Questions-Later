import type { BattleUnit } from '@pillage-first/types/models/battle';
import type { ResourceBundle } from '@pillage-first/types/models/resource';

export const calculateBattleUnitLosses = ({
  amountBefore,
  amountAfter,
  amountHospitalized,
  amountImprisoned,
}: Pick<
  BattleUnit,
  'amountBefore' | 'amountAfter' | 'amountHospitalized' | 'amountImprisoned'
>) => {
  const casualties = amountBefore - amountAfter - amountImprisoned;

  return {
    casualties,
    dead: casualties - amountHospitalized,
  };
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

    for (const amount of available) {
      if (amount > 0) {
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
