import type { Troop } from '@pillage-first/types/models/troop';
import type { UnitId } from '@pillage-first/types/models/unit';
import { unitsMap } from '../units';

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

export type CombatTroop = {
  troop: Troop;
  unitId: UnitId;
  amount: number;
  smithyLevel: number;
};

export type WallType =
  | 'ROMAN_WALL'
  | 'GAUL_WALL'
  | 'TEUTONIC_WALL'
  | 'EGYPTIAN_WALL'
  | 'HUN_WALL'
  | 'SPARTAN_WALL';

export type DefenceModifiers = {
  wallType: WallType | null;
  wallLevel: number;
  wallDurability: number;
  palaceLevel: number;
};

export type CombatTroopResult = {
  troop: Troop;
  unitId: UnitId;
  amountBefore: number;
  amountLost: number;
  amountAfter: number;
};

export type CombatResult = {
  attackerWins: boolean;
  canAttackerSeeFullReport: boolean;
  attackerTroops: CombatTroopResult[];
  defenderTroops: CombatTroopResult[];
  attackerSurvivors: CombatTroop[];
  defenderSurvivors: CombatTroop[];
  attackerLosses: CombatTroop[];
  defenderLosses: CombatTroop[];
  attackerTotalPoints: number;
  defenderTotalPoints: number;
  wallDamage: number;
  totalCarryCapacity: number;
  loot: [number, number, number, number];
};

// ───────────────────────────────────────────────────────────────
// Mappers
// ───────────────────────────────────────────────────────────────

export const combatTroopToTroop = (t: CombatTroop): Troop => ({
  unitId: t.unitId,
  amount: t.amount,
  tileId: t.troop.tileId,
  source: t.troop.source,
});

// ───────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────

/** Empty village always provides 10 base defence points */
const BASE_VILLAGE_DEFENCE = 10;

/** A lone attacker with < 83 offense always dies */
const LONE_ATTACKER_DEATH_THRESHOLD = 83;

/** Wall defence bonus base per tribe: wallBonus = base^level */
const WALL_BONUS_BASE: Record<WallType, number> = {
  ROMAN_WALL: 1.03,
  GAUL_WALL: 1.025,
  TEUTONIC_WALL: 1.02,
  EGYPTIAN_WALL: 1.025,
  HUN_WALL: 1.015,
  SPARTAN_WALL: 1.02,
};

/** Wall durability: higher = harder to destroy with rams */
export const WALL_DURABILITY: Record<string, number> = {
  TEUTONIC_WALL: 5,
  GAUL_WALL: 2,
  ROMAN_WALL: 1,
  EGYPTIAN_WALL: 4,
  HUN_WALL: 1,
  SPARTAN_WALL: 2,
  NATURE_WALL: 3,
  NATAR_WALL: 2,
};

// ───────────────────────────────────────────────────────────────
// Smithy Upgrade Formula
// ───────────────────────────────────────────────────────────────

/**
 * Travian smithy improvement formula:
 * improved_value = BASE + (BASE + 300 * UPKEEP / 7) * (1.007^LEVEL - 1)
 */
export const calculateSmithyUpgrade = (
  baseValue: number,
  upkeep: number,
  level: number,
): number => {
  if (level <= 0) {
    return baseValue;
  }
  return baseValue + (baseValue + (300 * upkeep) / 7) * (1.007 ** level - 1);
};

// ───────────────────────────────────────────────────────────────
// Offense Calculation
// ───────────────────────────────────────────────────────────────

/**
 * Calculate total offense points for an attacking army.
 * Each unit's attack is improved by smithy level, then multiplied by count.
 */
export const calculateTotalOffensePoints = (troops: CombatTroop[]): number => {
  let total = 0;
  for (const troop of troops) {
    const unit = unitsMap.get(troop.unitId);
    if (!unit) {
      continue;
    }
    const improved = calculateSmithyUpgrade(
      unit.attack,
      unit.unitWheatConsumption,
      troop.smithyLevel,
    );
    total += improved * troop.amount;
  }
  return total;
};

/**
 * Compute the ratio of infantry vs cavalry offense points.
 * Returns [infantryRatio, cavalryRatio] summing to 1.
 * Siege/hero/admin units are treated as infantry for ratio purposes.
 */
export const calculateInfantryCavalryRatio = (
  troops: CombatTroop[],
): [number, number] => {
  let infantryOffense = 0;
  let cavalryOffense = 0;

  for (const troop of troops) {
    const unit = unitsMap.get(troop.unitId);
    if (!unit) {
      continue;
    }
    const improved = calculateSmithyUpgrade(
      unit.attack,
      unit.unitWheatConsumption,
      troop.smithyLevel,
    );
    const points = improved * troop.amount;

    if (unit.category === 'cavalry') {
      cavalryOffense += points;
    } else {
      infantryOffense += points;
    }
  }

  const totalOffense = infantryOffense + cavalryOffense;

  if (totalOffense === 0) {
    return [0.5, 0.5];
  }

  return [infantryOffense / totalOffense, cavalryOffense / totalOffense];
};

// ───────────────────────────────────────────────────────────────
// Defence Calculation
// ───────────────────────────────────────────────────────────────

/**
 * Calculate total defence points for a defending army.
 * Uses the weighted infantry/cavalry ratio from the attacker's composition.
 */
export const calculateTotalDefencePoints = (
  defenderTroops: CombatTroop[],
  infantryRatio: number,
  cavalryRatio: number,
): number => {
  let total = 0;

  for (const troop of defenderTroops) {
    const unit = unitsMap.get(troop.unitId);
    if (!unit) {
      continue;
    }

    const improvedInfDef = calculateSmithyUpgrade(
      unit.infantryDefence,
      unit.unitWheatConsumption,
      troop.smithyLevel,
    );
    const improvedCavDef = calculateSmithyUpgrade(
      unit.cavalryDefence,
      unit.unitWheatConsumption,
      troop.smithyLevel,
    );

    const weightedDefence =
      infantryRatio * improvedInfDef + cavalryRatio * improvedCavDef;
    total += weightedDefence * troop.amount;
  }

  return total;
};

// ───────────────────────────────────────────────────────────────
// Wall & Palace Defence
// ───────────────────────────────────────────────────────────────

/**
 * Wall defence bonus multiplier: base^level
 * E.g. Roman city wall lvl 15: 1.03^15 ≈ 1.558
 */
export const calculateWallDefenceBonus = (
  wallType: WallType | null,
  level: number,
): number => {
  if (!wallType || level <= 0) {
    return 1;
  }
  const base = WALL_BONUS_BASE[wallType];
  return base ** level;
};

/**
 * Palace/Residence defence contribution: 2 * level^2
 * Returns absolute defence points (applied to both infantry and cavalry).
 */
export const calculatePalaceDefence = (level: number): number => {
  if (level <= 0) {
    return 0;
  }
  return 2 * level ** 2;
};

// ───────────────────────────────────────────────────────────────
// Immensity Exponent (K)
// ───────────────────────────────────────────────────────────────

/**
 * K = 2 * (1.8592 - N^0.015)
 * Clamped between 1.2578 and 1.5.
 * N is total unit count in battle. K = 1.5 when N ≤ 1000.
 */
export const calculateImmensityExponent = (totalUnitCount: number): number => {
  if (totalUnitCount <= 1000) {
    return 1.5;
  }
  const k = 2 * (1.8592 - totalUnitCount ** 0.015);
  return Math.max(1.2578, Math.min(1.5, k));
};

// ───────────────────────────────────────────────────────────────
// Casualty Formulas
// ───────────────────────────────────────────────────────────────

/**
 * Standard casualty formula for the WINNER of a normal attack:
 * casualtyPercent = (loserPoints / winnerPoints) ^ K
 *
 * For raids, modified formula:
 * x = (loserPoints / winnerPoints) ^ K
 * casualtyPercent = x / (1 + x)
 */
export const calculateWinnerCasualtyPercent = (
  loserPoints: number,
  winnerPoints: number,
  totalUnitCount: number,
  isRaid: boolean,
): number => {
  if (winnerPoints <= 0) {
    return 1;
  }

  const k = calculateImmensityExponent(totalUnitCount);
  const x = (loserPoints / winnerPoints) ** k;

  if (isRaid) {
    return x / (1 + x);
  }

  return x;
};

// ───────────────────────────────────────────────────────────────
// Carry Capacity & Loot
// ───────────────────────────────────────────────────────────────

/**
 * Compute total carry capacity of surviving attackers.
 */
export const calculateTotalCarryCapacity = (
  troops: { unitId: UnitId; amount: number }[],
): number => {
  let total = 0;
  for (const troop of troops) {
    const unit = unitsMap.get(troop.unitId);
    if (!unit) {
      continue;
    }
    total += unit.unitCarryCapacity * troop.amount;
  }
  return total;
};

/**
 * Calculate loot from defenders resource pool.
 * Resources are taken as evenly as possible, up to carry capacity.
 */
export const calculateLoot = (
  defenderResources: [number, number, number, number],
  carryCapacity: number,
): [number, number, number, number] => {
  if (carryCapacity <= 0) {
    return [0, 0, 0, 0];
  }

  const totalAvailable =
    defenderResources[0] +
    defenderResources[1] +
    defenderResources[2] +
    defenderResources[3];

  if (totalAvailable <= 0) {
    return [0, 0, 0, 0];
  }

  // Take proportionally from each resource, capped by what's available
  const canTake = Math.min(carryCapacity, totalAvailable);

  // First pass: try equal share
  const loot: [number, number, number, number] = [0, 0, 0, 0];
  let remaining = canTake;

  // Sort resources by availability to handle cases where one is low
  const indices: [number, number][] = defenderResources.map((r, i) => [r, i]);
  indices.sort((a, b) => a[0] - b[0]);

  let slots = 4;
  for (const [available, idx] of indices) {
    const share = remaining / slots;
    const taken = Math.min(Math.floor(available), Math.floor(share));
    loot[idx] = taken;
    remaining -= taken;
    slots -= 1;
  }

  return loot;
};

// ───────────────────────────────────────────────────────────────
// Ram Wall Damage
// ───────────────────────────────────────────────────────────────

/**
 * Calculate how many wall levels rams destroy.
 * Travian formula: wallLevelsDestroyed = floor(numberOfRams / (wallDurability * wallLevel))
 * If wall level is 0, rams have no target — skip.
 * If result would reduce wall below 0, cap at 0.
 */
export const calculateWallDamage = (
  survivingRams: number,
  wallLevel: number,
  wallType: WallType | null,
  wallDurability: number,
): number => {
  if (
    survivingRams <= 0 ||
    wallLevel <= 0 ||
    !wallType ||
    wallDurability <= 0
  ) {
    return 0;
  }

  const levelsDestroyed = Math.floor(
    survivingRams / (wallDurability * wallLevel),
  );
  return Math.min(levelsDestroyed, wallLevel);
};

// ───────────────────────────────────────────────────────────────
// Main Combat Resolution
// ───────────────────────────────────────────────────────────────

/**
 * Resolve a full combat encounter between attacker and defender.
 * Implements the exact Travian combat formulas.
 */
export const resolveCombat = (
  attackerTroops: CombatTroop[],
  defenderTroops: CombatTroop[],
  modifiers: DefenceModifiers,
  defenderResources: [number, number, number, number],
  isRaid: boolean,
): CombatResult => {
  // ─── Step 1: Calculate offense ───
  const totalOffense = calculateTotalOffensePoints(attackerTroops);

  // ─── Step 2: Infantry/cavalry ratio ───
  const [infantryRatio, cavalryRatio] =
    calculateInfantryCavalryRatio(attackerTroops);

  // ─── Step 3: Calculate raw defence ───
  let troopDefence = calculateTotalDefencePoints(
    defenderTroops,
    infantryRatio,
    cavalryRatio,
  );

  // ─── Step 4: Add base village defence ───
  const baseAndPalaceDefence =
    BASE_VILLAGE_DEFENCE + calculatePalaceDefence(modifiers.palaceLevel);

  // ─── Step 5: Apply wall bonus to troops + base defence ───
  const wallBonus = calculateWallDefenceBonus(
    modifiers.wallType,
    modifiers.wallLevel,
  );

  // Wall bonus applies to troops AND base+palace defence
  troopDefence *= wallBonus;
  const totalDefence = troopDefence + baseAndPalaceDefence * wallBonus;

  // ─── Step 6: Determine winner ───
  const attackerWins = totalOffense >= totalDefence;

  // ─── Step 7: Total unit count for K calculation ───
  const countTroops = (troops: CombatTroop[]) => {
    let count = 0;
    for (const { amount } of troops) {
      count += amount;
    }
    return count;
  };
  const attackerCount = countTroops(attackerTroops);
  const defenderCount = countTroops(defenderTroops);
  const totalUnitCount = attackerCount + defenderCount;

  // ─── Step 8: Calculate casualty percentages ───
  const winnerPoints = attackerWins ? totalOffense : totalDefence;
  const loserPoints = attackerWins ? totalDefence : totalOffense;

  const winnerCasualtyPercent = calculateWinnerCasualtyPercent(
    loserPoints,
    winnerPoints,
    totalUnitCount,
    isRaid,
  );

  // Loser is completely destroyed in normal attack
  // In raids, loser loses (100% - winnerCasualtyPercent)
  const loserCasualtyPercent = isRaid ? 1 - winnerCasualtyPercent : 1;

  // ─── Step 9: Lone attacker check ───
  const isLoneAttacker = attackerCount === 1;
  let forceAttackerDeath = false;
  if (isLoneAttacker && totalOffense < LONE_ATTACKER_DEATH_THRESHOLD) {
    forceAttackerDeath = true;
  }

  // ─── Step 10: Apply casualties ───
  const attackerCasualtyPercent = attackerWins
    ? winnerCasualtyPercent
    : loserCasualtyPercent;
  const defenderCasualtyPercent = attackerWins
    ? loserCasualtyPercent
    : winnerCasualtyPercent;

  const attackerSurvivors: CombatResult['attackerSurvivors'] = [];
  const attackerLosses: CombatResult['attackerLosses'] = [];

  const attackerTroopsResult: CombatResult['defenderTroops'] = [];

  for (const troop of attackerTroops) {
    let lost: number;
    if (forceAttackerDeath) {
      lost = troop.amount;
    } else {
      lost = Math.round(troop.amount * attackerCasualtyPercent);
    }
    const survived = troop.amount - lost;

    attackerTroopsResult.push({
      troop: troop.troop,
      unitId: troop.unitId,
      amountBefore: troop.amount,
      amountLost: lost,
      amountAfter: survived,
    });

    if (survived > 0) {
      attackerSurvivors.push({
        troop: troop.troop,
        unitId: troop.unitId,
        amount: survived,
        smithyLevel: troop.smithyLevel,
      });
    }
    if (lost > 0) {
      attackerLosses.push({
        troop: troop.troop,
        unitId: troop.unitId,
        amount: lost,
        smithyLevel: troop.smithyLevel,
      });
    }
  }

  const defenderSurvivors: CombatResult['defenderSurvivors'] = [];
  const defenderLosses: CombatResult['defenderLosses'] = [];

  const defenderTroopsResult: CombatResult['defenderTroops'] = [];

  for (const troop of defenderTroops) {
    const lost = Math.round(troop.amount * defenderCasualtyPercent);
    const survived = troop.amount - lost;

    defenderTroopsResult.push({
      troop: troop.troop,
      unitId: troop.unitId,
      amountBefore: troop.amount,
      amountLost: lost,
      amountAfter: survived,
    });

    if (survived > 0) {
      defenderSurvivors.push({
        troop: troop.troop,
        unitId: troop.unitId,
        amount: survived,
        smithyLevel: troop.smithyLevel,
      });
    }
    if (lost > 0) {
      defenderLosses.push({
        troop: troop.troop,
        unitId: troop.unitId,
        amount: lost,
        smithyLevel: troop.smithyLevel,
      });
    }
  }

  // ─── Step 11: Wall damage from rams ───
  const ramUnits = [
    'ROMAN_RAM',
    'GAUL_RAM',
    'TEUTONIC_RAM',
    'EGYPTIAN_RAM',
    'HUN_RAM',
    'SPARTAN_RAM',
    'NATARIAN_RAM',
  ] as const;

  let survivingRams = 0;
  for (const surv of attackerSurvivors) {
    if ((ramUnits as readonly string[]).includes(surv.unitId)) {
      survivingRams += surv.amount;
    }
  }

  const wallDamage = calculateWallDamage(
    survivingRams,
    modifiers.wallLevel,
    modifiers.wallType,
    modifiers.wallDurability,
  );

  // ─── Step 12: Loot ───
  const carryCapacity = calculateTotalCarryCapacity(attackerSurvivors);
  const loot = calculateLoot(defenderResources, carryCapacity);

  // ─── Step 13: Meta ───
  const canAttackerSeeFullReport =
    attackerSurvivors.length > 0 || defenderCasualtyPercent > 0.25;

  return {
    attackerWins: attackerWins && !forceAttackerDeath,
    canAttackerSeeFullReport,
    attackerTroops: attackerTroopsResult,
    defenderTroops: defenderTroopsResult,
    attackerSurvivors,
    defenderSurvivors,
    attackerLosses,
    defenderLosses,
    attackerTotalPoints: Math.round(totalOffense),
    defenderTotalPoints: Math.round(totalDefence),
    wallDamage,
    totalCarryCapacity: carryCapacity,
    loot,
  };
};
