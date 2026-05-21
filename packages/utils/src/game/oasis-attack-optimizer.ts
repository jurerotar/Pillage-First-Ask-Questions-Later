import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type { NatureUnitId, UnitId } from '@pillage-first/types/models/unit';

export type OasisAnimalAmount = {
  unitId: NatureUnitId;
  amount: number;
};

export type AvailableUnitAmount = {
  unitId: UnitId;
  amount: number;
};

export type UnitCombatStats = {
  unitId: UnitId;
  attack: number;
  infantryDefence: number;
  cavalryDefence: number;
};

export type OasisAttackOptimizerOptions = {
  armySizePenaltyCoefficient?: number;
  cavalryPenaltyCoefficient?: number;
  maxCoordinateDescentPasses?: number;
};

export type UnitLoss = {
  unitId: UnitId;
  amount: number;
};

export type OasisAttackOptimizationResult = {
  bestComposition: AvailableUnitAmount[];
  objectiveScore: number;
  lossPercentage: number;
  unitLosses: UnitLoss[];
  totalLossCost: number;
};

const sumRecruitmentCost = (unitId: UnitId) => {
  return getUnitDefinition(unitId).baseRecruitmentCost.reduce(
    (total, resourceAmount) => total + resourceAmount,
    0,
  );
};

const calculateOasisDefence = (animals: readonly OasisAnimalAmount[]) => {
  return animals.reduce(
    (total, { unitId, amount }) => {
      const unit = getUnitDefinition(unitId);

      return {
        infantryDefence: total.infantryDefence + unit.infantryDefence * amount,
        cavalryDefence: total.cavalryDefence + unit.cavalryDefence * amount,
      };
    },
    { infantryDefence: 0, cavalryDefence: 0 },
  );
};

const calculateLossPercentage = (
  composition: AvailableUnitAmount[],
  animals: readonly OasisAnimalAmount[],
  unitCombatStats: readonly UnitCombatStats[],
) => {
  const unitCombatStatsByUnitId = new Map(
    unitCombatStats.map((unit) => [unit.unitId, unit]),
  );

  const { infantryPower, cavalryPower } = composition.reduce(
    (total, { unitId, amount }) => {
      const unit = getUnitDefinition(unitId);
      const stats = unitCombatStatsByUnitId.get(unitId);
      const attackPower = (stats?.attack ?? unit.attack) * amount;

      if (unit.category === 'cavalry') {
        return {
          infantryPower: total.infantryPower,
          cavalryPower: total.cavalryPower + attackPower,
        };
      }

      return {
        infantryPower: total.infantryPower + attackPower,
        cavalryPower: total.cavalryPower,
      };
    },
    { infantryPower: 0, cavalryPower: 0 },
  );

  const totalPower = infantryPower + cavalryPower;

  if (totalPower === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const { infantryDefence, cavalryDefence } = calculateOasisDefence(animals);
  const effectiveDefence =
    infantryDefence * (infantryPower / totalPower) +
    cavalryDefence * (cavalryPower / totalPower);

  return 100 * (effectiveDefence / totalPower) ** 1.5;
};

const calculateObjectiveScore = (
  composition: AvailableUnitAmount[],
  animals: readonly OasisAnimalAmount[],
  unitCombatStats: readonly UnitCombatStats[],
  armySizePenaltyCoefficient: number,
  cavalryPenaltyCoefficient: number,
) => {
  if (composition.every(({ amount }) => amount === 0)) {
    return Number.POSITIVE_INFINITY;
  }

  const lossPercentage = calculateLossPercentage(
    composition,
    animals,
    unitCombatStats,
  );

  const lossCostPenalty = composition.reduce((total, { unitId, amount }) => {
    const unitLoss = Math.round((amount * lossPercentage) / 100);
    return total + unitLoss * sumRecruitmentCost(unitId);
  }, 0);

  const armySizePenalty = composition.reduce((total, { unitId, amount }) => {
    const unit = getUnitDefinition(unitId);
    const coefficient =
      unit.category === 'cavalry' ? cavalryPenaltyCoefficient : 1;

    return total + amount * coefficient;
  }, 0);

  return lossCostPenalty + armySizePenalty * armySizePenaltyCoefficient;
};

const normalizeAvailableUnits = (units: readonly AvailableUnitAmount[]) => {
  return units
    .filter(({ amount }) => amount > 0)
    .map(({ unitId, amount }) => ({
      unitId,
      amount: Math.floor(amount),
    }));
};

const createFullComposition = (availableUnits: AvailableUnitAmount[]) => {
  return availableUnits.map(({ unitId, amount }) => ({
    unitId,
    amount,
  }));
};

const createEmptyComposition = (availableUnits: AvailableUnitAmount[]) => {
  return availableUnits.map(({ unitId }) => ({
    unitId,
    amount: 0,
  }));
};

const getInitialStepSize = (maxAmount: number) => {
  if (maxAmount <= 1) {
    return 1;
  }

  return 2 ** Math.floor(Math.log2(maxAmount));
};

const cloneComposition = (composition: AvailableUnitAmount[]) => {
  return composition.map((unit) => ({ ...unit }));
};

const createSingleUnitComposition = (
  availableUnits: AvailableUnitAmount[],
  unitIndex: number,
  amount: number,
) => {
  const composition = createEmptyComposition(availableUnits);
  composition[unitIndex].amount = amount;

  return composition;
};

const optimizeCompositionWithCoordinateDescent = (
  initialComposition: AvailableUnitAmount[],
  availableUnits: AvailableUnitAmount[],
  animals: readonly OasisAnimalAmount[],
  unitCombatStats: readonly UnitCombatStats[],
  armySizePenaltyCoefficient: number,
  cavalryPenaltyCoefficient: number,
  maxPasses: number,
) => {
  let bestComposition = cloneComposition(initialComposition);
  let bestScore = calculateObjectiveScore(
    bestComposition,
    animals,
    unitCombatStats,
    armySizePenaltyCoefficient,
    cavalryPenaltyCoefficient,
  );

  const stepSizes = availableUnits.map(({ amount }) =>
    getInitialStepSize(amount),
  );
  let pass = 0;

  while (stepSizes.some((step) => step > 0) && pass < maxPasses) {
    let improvedThisPass = false;

    for (const [unitIndex, availableUnit] of availableUnits.entries()) {
      const currentAmount = bestComposition[unitIndex].amount;
      const step = stepSizes[unitIndex];
      const candidateAmounts = [
        currentAmount - step,
        currentAmount + step,
        0,
        availableUnit.amount,
      ]
        .map((amount) =>
          Math.max(0, Math.min(availableUnit.amount, Math.floor(amount))),
        )
        .filter((amount, index, amounts) => amounts.indexOf(amount) === index);

      for (const amount of candidateAmounts) {
        if (amount === currentAmount) {
          continue;
        }

        const candidateComposition = cloneComposition(bestComposition);
        candidateComposition[unitIndex].amount = amount;
        const candidateScore = calculateObjectiveScore(
          candidateComposition,
          animals,
          unitCombatStats,
          armySizePenaltyCoefficient,
          cavalryPenaltyCoefficient,
        );

        if (candidateScore < bestScore) {
          bestComposition = candidateComposition;
          bestScore = candidateScore;
          improvedThisPass = true;
        }
      }
    }

    if (!improvedThisPass) {
      for (const [index, step] of stepSizes.entries()) {
        stepSizes[index] = Math.floor(step / 2);
      }
    }

    pass++;
  }

  return {
    composition: bestComposition,
    score: bestScore,
  };
};

export const calculateOptimalOasisAttackComposition = (
  animals: readonly OasisAnimalAmount[],
  availableUnits: readonly AvailableUnitAmount[],
  unitCombatStats: readonly UnitCombatStats[],
  options: OasisAttackOptimizerOptions = {},
): OasisAttackOptimizationResult => {
  const {
    armySizePenaltyCoefficient = 3,
    cavalryPenaltyCoefficient = 10,
    maxCoordinateDescentPasses = 100,
  } = options;

  const usableUnits = normalizeAvailableUnits(availableUnits).filter(
    ({ unitId }) => getUnitDefinition(unitId).attack > 0,
  );

  if (usableUnits.length === 0) {
    return {
      bestComposition: [],
      objectiveScore: Number.POSITIVE_INFINITY,
      lossPercentage: Number.POSITIVE_INFINITY,
      unitLosses: [],
      totalLossCost: 0,
    };
  }

  const startingCompositions = [
    createFullComposition(usableUnits),
    ...usableUnits.map(({ amount }, unitIndex) =>
      createSingleUnitComposition(usableUnits, unitIndex, amount),
    ),
  ];

  const optimizationResults = startingCompositions.map((composition) =>
    optimizeCompositionWithCoordinateDescent(
      composition,
      usableUnits,
      animals,
      unitCombatStats,
      armySizePenaltyCoefficient,
      cavalryPenaltyCoefficient,
      maxCoordinateDescentPasses,
    ),
  );
  const { composition: bestComposition, score: bestScore } =
    optimizationResults.reduce((best, current) =>
      current.score < best.score ? current : best,
    );

  const lossPercentage = calculateLossPercentage(
    bestComposition,
    animals,
    unitCombatStats,
  );
  const unitLosses = bestComposition.map(({ unitId, amount }) => ({
    unitId,
    amount: Math.round((amount * lossPercentage) / 100),
  }));
  const totalLossCost = unitLosses.reduce((total, { unitId, amount }) => {
    return total + amount * sumRecruitmentCost(unitId);
  }, 0);

  return {
    bestComposition: bestComposition.filter(({ amount }) => amount > 0),
    objectiveScore: bestScore,
    lossPercentage,
    unitLosses: unitLosses.filter(({ amount }) => amount > 0),
    totalLossCost,
  };
};
