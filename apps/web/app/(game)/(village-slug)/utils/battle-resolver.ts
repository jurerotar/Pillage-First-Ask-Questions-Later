import z from 'zod';
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { unitIdSchema } from '@pillage-first/types/models/unit';

const winnerSchema = z.enum(['attacker', 'defender']);

const battleTroopSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.number(),
  improvementLevel: z.number(),
});

export const armySchema = z.strictObject({
  tribe: tribeSchema,
  troops: z.array(battleTroopSchema),
});

export type BattleTroop = z.infer<typeof battleTroopSchema>;
export type Army = z.infer<typeof armySchema>;
export type BattleReportWinner = z.infer<typeof winnerSchema>;

export const calculateImprovedCombatStrength = (
  baseStrength: number,
  wheatConsumption: number,
  improvementLevel: number,
) =>
  baseStrength +
  (baseStrength + 300 * (wheatConsumption / 7)) *
    (1.007 ** improvementLevel - 1);

export const calculateWallBonus = (tribe: Tribe, level: number) => {
  if (level === 0) {
    return {
      wallFlatDefenceBonus: 0,
      wallPercentDefenceBonus: 1,
    };
  }

  var flatBonusPerLevel: number;
  var percentBonusPerLevel: number;

  switch (tribe) {
    case 'gauls':
      flatBonusPerLevel = 8;
      percentBonusPerLevel = 1.025;
      break;
    case 'romans':
      flatBonusPerLevel = 10;
      percentBonusPerLevel = 1.03;
      break;
    case 'teutons':
      flatBonusPerLevel = 6;
      percentBonusPerLevel = 1.02;
      break;
    case 'egyptians':
      flatBonusPerLevel = 8;
      percentBonusPerLevel = 1.025;
      break;
    case 'huns':
      flatBonusPerLevel = 6;
      percentBonusPerLevel = 1.015;
      break;
    default:
      // TODO: throw an error
      flatBonusPerLevel = 0;
      percentBonusPerLevel = 1;
  }

  return {
    wallFlatDefenceBonus: flatBonusPerLevel * level,
    wallPercentDefenceBonus: percentBonusPerLevel ** level,
  };
};

const clamp = (x: number, min: number, max: number) =>
  Math.min(max, Math.max(x, min));

type ResolveAttackValueArgs = {
  attackingArmy: Army;
};

export const resolveAttackValue = ({
  attackingArmy,
}: ResolveAttackValueArgs) => {
  var attackingTroopCount = 0;

  const { infAtt, cavAtt } = attackingArmy.troops.reduce(
    ({ infAtt, cavAtt }, troop) => {
      attackingTroopCount += troop.amount;

      const unitDef = getUnitDefinition(troop.unitId);
      const improvedAttack = calculateImprovedCombatStrength(
        unitDef.attack,
        unitDef.unitWheatConsumption,
        troop.improvementLevel,
      );
      const attack = improvedAttack * troop.amount;

      if (unitDef.category === 'hero') {
        // TODO: if hero is mounted count as cavalry
        return { infAtt: infAtt + attack, cavAtt };
      }
      if (unitDef.category === 'cavalry') {
        return { infAtt, cavAtt: cavAtt + attack };
      }
      return { infAtt: infAtt + attack, cavAtt };
    },
    { infAtt: 0, cavAtt: 0 },
  );

  const totalAttackPoints = infAtt + cavAtt;
  const infAttackProportion =
    totalAttackPoints === 0 ? 0 : infAtt / totalAttackPoints;
  const cavAttackProportion =
    totalAttackPoints === 0 ? 0 : cavAtt / totalAttackPoints;

  return {
    totalAttackPoints,
    attackingTroopCount,
    infAttackProportion,
    cavAttackProportion,
  };
};

type ResolveDefenceValueArgs = {
  defendingArmy: Army;
  reinforcingArmies: Army[];
  infAttackProportion: number;
  cavAttackProportion: number;
  wallFlatDefenceBonus: number;
  wallPercentDefenceBonus: number;
};

const resolveArmyDefenceValues = (army: Army) => {
  return army.troops.reduce(
    ({ troopCount, infDef, cavDef }, troop) => {
      var unitDef = getUnitDefinition(troop.unitId);
      const improvedInfantryDefence = calculateImprovedCombatStrength(
        unitDef.infantryDefence,
        unitDef.unitWheatConsumption,
        troop.improvementLevel,
      );
      const improvedCavalryDefence = calculateImprovedCombatStrength(
        unitDef.cavalryDefence,
        unitDef.unitWheatConsumption,
        troop.improvementLevel,
      );
      return {
        troopCount: troopCount + troop.amount,
        infDef: infDef + improvedInfantryDefence * troop.amount,
        cavDef: cavDef + improvedCavalryDefence * troop.amount,
      };
    },
    { troopCount: 0, infDef: 0, cavDef: 0 },
  );
};

export const resolveDefenceValue = (args: ResolveDefenceValueArgs) => {
  const {
    defendingArmy,
    reinforcingArmies,
    infAttackProportion,
    cavAttackProportion,
    wallFlatDefenceBonus,
    wallPercentDefenceBonus,
  } = args;
  const allDefendingArmies = reinforcingArmies.concat(defendingArmy);

  const { defendingTroopCount, totalInfDef, totalCavDef } =
    allDefendingArmies.reduce(
      ({ defendingTroopCount, totalInfDef, totalCavDef }, army) => {
        const { troopCount, infDef, cavDef } = resolveArmyDefenceValues(army);
        return {
          defendingTroopCount: defendingTroopCount + troopCount,
          totalInfDef: totalInfDef + infDef,
          totalCavDef: totalCavDef + cavDef,
        };
      },
      {
        defendingTroopCount: 0,
        totalInfDef: 0,
        totalCavDef: 0,
      },
    );

  const totalInfantryDefenceProportional = totalInfDef * infAttackProportion;
  const totalCavalryDefenceProportional = totalCavDef * cavAttackProportion;

  var totalDefencePoints =
    totalInfantryDefenceProportional + totalCavalryDefenceProportional;

  // Add wall percentage bonus
  totalDefencePoints *= wallPercentDefenceBonus;

  // Add wall flat bonus
  totalDefencePoints += wallFlatDefenceBonus;

  // Add city base defence
  totalDefencePoints += 10;

  return {
    totalDefencePoints,
    defendingTroopCount,
  };
};

export type BattleCasualties = {
  winner: 'attacker' | 'defender';
  totalAttackPoints: number;
  totalDefencePoints: number;
  attackerCasualtyRate: number;
  defenderCasualtyRate: number;
};

type ResolveCasualtiesArgs = {
  battleType: 'raid' | 'attack';
  totalAttackPoints: number;
  totalDefencePoints: number;
  attackingTroopCount: number;
  totalTroopCount: number;
};

export const resolveCasualties = (
  args: ResolveCasualtiesArgs,
): BattleCasualties => {
  const {
    battleType,
    totalAttackPoints,
    totalDefencePoints,
    attackingTroopCount,
    totalTroopCount,
  } = args;

  const winner: BattleReportWinner =
    totalAttackPoints > totalDefencePoints ? 'attacker' : 'defender';

  const winnerPoints =
    winner === 'attacker' ? totalAttackPoints : totalDefencePoints;
  const loserPoints =
    winner === 'attacker' ? totalDefencePoints : totalAttackPoints;

  // Scalar for large battles, increases casualties when > 1000 troops
  const K =
    totalTroopCount <= 1000
      ? 1.5
      : clamp(2 * (1.8592 - totalTroopCount ** 0.015), 1.2578, 1.5);

  const baseWinnerCasualties =
    winnerPoints !== 0 ? (loserPoints / winnerPoints) ** K : 0;

  const winnerCasualties =
    battleType === 'raid'
      ? baseWinnerCasualties / (1 + baseWinnerCasualties)
      : baseWinnerCasualties;
  const loserCasualties = battleType === 'raid' ? 1 - winnerCasualties : 1;

  var attackerCasualtyRate =
    winner === 'attacker' ? winnerCasualties : loserCasualties;
  const defenderCasualtyRate =
    winner === 'attacker' ? loserCasualties : winnerCasualties;

  // Special rule for when the attack is a single unit
  if (attackingTroopCount === 1 && totalAttackPoints < 83) {
    attackerCasualtyRate = 1;
  }

  return {
    winner,
    totalAttackPoints,
    totalDefencePoints,
    attackerCasualtyRate,
    defenderCasualtyRate,
  };
};

const battleResultSchema = z.strictObject({
  winner: winnerSchema,
  totalAttackPoints: z.number(),
  totalDefencePoints: z.number(),
  attackerCasualtyRate: z.number().lte(1),
  defenderCasualtyRate: z.number().lte(1),
});
export type BattleResult = z.infer<typeof battleResultSchema>;

const battleTypeSchema = z.enum(['attack', 'raid']);
export type BattleType = z.infer<typeof battleTypeSchema>;

const battleContextSchema = z.strictObject({
  battleType: battleTypeSchema,
  attackingArmy: armySchema,
  defendingArmy: armySchema,
  reinforcingArmies: z.array(armySchema),
  wallLevel: z.number().default(0),
});

export type BattleContext = z.infer<typeof battleContextSchema>;

export const resolveBattle = ({
  battleType,
  attackingArmy,
  defendingArmy,
  reinforcingArmies,
  wallLevel,
}: BattleContext): BattleResult => {
  const {
    totalAttackPoints,
    attackingTroopCount,
    cavAttackProportion,
    infAttackProportion,
  } = resolveAttackValue({
    attackingArmy,
  });

  const { wallFlatDefenceBonus, wallPercentDefenceBonus } = calculateWallBonus(
    defendingArmy.tribe,
    wallLevel,
  );

  const { defendingTroopCount, totalDefencePoints } = resolveDefenceValue({
    defendingArmy,
    reinforcingArmies,
    cavAttackProportion,
    infAttackProportion,
    wallFlatDefenceBonus,
    wallPercentDefenceBonus,
  });

  const totalTroopCount = defendingTroopCount + attackingTroopCount;

  const { winner, attackerCasualtyRate, defenderCasualtyRate } =
    resolveCasualties({
      attackingTroopCount,
      battleType,
      totalAttackPoints,
      totalDefencePoints,
      totalTroopCount,
    });

  return {
    winner,
    totalAttackPoints,
    totalDefencePoints,
    attackerCasualtyRate,
    defenderCasualtyRate,
  };
};
