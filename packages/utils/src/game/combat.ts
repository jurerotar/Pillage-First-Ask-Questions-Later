import type {
  BattleStatistics,
  BattleUnit,
} from '@pillage-first/types/models/battle';
import type { ResourceBundle } from '@pillage-first/types/models/resource';
import type { Unit } from '@pillage-first/types/models/unit';

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

export type CombatUnit = BattleUnit &
  Pick<
    Unit,
    'unitWheatConsumption' | 'baseRecruitmentCost' | 'unitCarryCapacity'
  >;

export const calculateCombatStatistics = (
  units: readonly Omit<CombatUnit, 'unitCarryCapacity'>[],
): Omit<BattleStatistics, 'points'> => {
  let supplyBefore = 0;
  let supplyLost = 0;
  let resourcesLost = 0;

  for (const unit of units) {
    const { casualties } = calculateBattleUnitLosses(unit);
    let resourceCost = 0;

    for (const cost of unit.baseRecruitmentCost) {
      resourceCost += cost;
    }

    supplyBefore += unit.amountBefore * unit.unitWheatConsumption;
    supplyLost += casualties * unit.unitWheatConsumption;
    resourcesLost += resourceCost * casualties;
  }

  return { supplyBefore, supplyLost, resourcesLost };
};

export const calculateSurvivingCarryCapacity = (
  units: readonly Pick<CombatUnit, 'amountAfter' | 'unitCarryCapacity'>[],
): number => {
  let totalCarryCapacity = 0;

  for (const { amountAfter, unitCarryCapacity } of units) {
    totalCarryCapacity += amountAfter * unitCarryCapacity;
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
