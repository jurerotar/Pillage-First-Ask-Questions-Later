import { unitsMap } from '@pillage-first/game-assets/units';
import type { ReportOutcome } from '@pillage-first/types/models/report';
import type { UnitId } from '@pillage-first/types/models/unit';

export type BattleTroop = {
  unitId: UnitId;
  amount: number;
};

export type BattleSide = {
  troops: BattleTroop[];
};

export type BattleModifiers = {
  // Multiplier applied to the defender's effective defence (e.g. 1.31 for wall lvl 10).
  wallDefenceBonus: number;
  // Flat defence added on top of the wall multiplier.
  wallDefenceBase: number;
  // Multiplier on defender's effective defence based on population/celebrations.
  // For now plug a constant 1; revisit when moral system lands.
  moralBonus: number;
  // Multiplier on defender's effective defence when target is an oasis.
  oasisDefenceBonus: number;
  // Raid halves the loss rate on both sides.
  attackerType: 'attack' | 'raid';
};

export type BattleLossRecord = {
  unitId: UnitId;
  amount: number;
  losses: number;
};

export type BattleResult = {
  outcome: ReportOutcome;
  attackPower: number;
  defencePower: number;
  attackerLossRate: number;
  defenderLossRate: number;
  attackerLosses: BattleLossRecord[];
  defenderLosses: BattleLossRecord[];
};

const isCavalry = (unitId: UnitId): boolean => {
  return unitsMap.get(unitId)?.category === 'cavalry';
};

const sumAttack = (troops: BattleTroop[]): number => {
  let total = 0;
  for (const { unitId, amount } of troops) {
    const unit = unitsMap.get(unitId);
    if (!unit) {
      continue;
    }
    total += unit.attack * amount;
  }
  return total;
};

const sumDefenceWeighted = (
  defenders: BattleTroop[],
  infantryShare: number,
  cavalryShare: number,
): number => {
  let total = 0;
  for (const { unitId, amount } of defenders) {
    const unit = unitsMap.get(unitId);
    if (!unit) {
      continue;
    }
    total +=
      amount *
      (unit.infantryDefence * infantryShare +
        unit.cavalryDefence * cavalryShare);
  }
  return total;
};

const distributeLosses = (
  troops: BattleTroop[],
  lossRate: number,
): BattleLossRecord[] => {
  return troops.map(({ unitId, amount }) => {
    const losses = Math.min(amount, Math.round(amount * lossRate));
    return { unitId, amount, losses };
  });
};

export const resolveBattle = (
  attackers: BattleSide,
  defenders: BattleSide,
  modifiers: BattleModifiers,
): BattleResult => {
  const rawAttackerPower = sumAttack(attackers.troops);

  let cavalryAttack = 0;
  for (const { unitId, amount } of attackers.troops) {
    const unit = unitsMap.get(unitId);
    if (!unit || !isCavalry(unitId)) {
      continue;
    }
    cavalryAttack += unit.attack * amount;
  }

  const cavalryShare =
    rawAttackerPower === 0 ? 0 : cavalryAttack / rawAttackerPower;
  const infantryShare = 1 - cavalryShare;

  const rawDefencePower = sumDefenceWeighted(
    defenders.troops,
    infantryShare,
    cavalryShare,
  );

  const effectiveDefencePower =
    (rawDefencePower * modifiers.wallDefenceBonus + modifiers.wallDefenceBase) *
    modifiers.moralBonus *
    (modifiers.oasisDefenceBonus > 0 ? modifiers.oasisDefenceBonus : 1);

  // Both sides empty — no fight.
  if (rawAttackerPower === 0 && effectiveDefencePower === 0) {
    return {
      outcome: 'draw',
      attackPower: 0,
      defencePower: 0,
      attackerLossRate: 0,
      defenderLossRate: 0,
      attackerLosses: distributeLosses(attackers.troops, 0),
      defenderLosses: distributeLosses(defenders.troops, 0),
    };
  }

  let attackerLossRate: number;
  let defenderLossRate: number;
  let outcome: ReportOutcome;

  if (rawAttackerPower > effectiveDefencePower) {
    const ratio =
      rawAttackerPower === 0 ? 0 : effectiveDefencePower / rawAttackerPower;
    attackerLossRate = ratio ** 1.5;
    defenderLossRate = 1;
    outcome = 'attacker-wins';
  } else if (effectiveDefencePower > rawAttackerPower) {
    const ratio =
      effectiveDefencePower === 0
        ? 0
        : rawAttackerPower / effectiveDefencePower;
    attackerLossRate = 1;
    defenderLossRate = ratio ** 1.5;
    outcome = 'defender-wins';
  } else {
    attackerLossRate = 0.5;
    defenderLossRate = 0.5;
    outcome = 'draw';
  }

  if (modifiers.attackerType === 'raid') {
    attackerLossRate *= 0.5;
    defenderLossRate *= 0.5;
  }

  return {
    outcome,
    attackPower: rawAttackerPower,
    defencePower: effectiveDefencePower,
    attackerLossRate,
    defenderLossRate,
    attackerLosses: distributeLosses(attackers.troops, attackerLossRate),
    defenderLosses: distributeLosses(defenders.troops, defenderLossRate),
  };
};
