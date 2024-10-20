import { calculateComputedEffect } from 'app/(game)/hooks/use-computed-effect';
import { unitsMap } from 'app/assets/units';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Hero } from 'app/interfaces/models/game/hero';
import type { Tile } from 'app/interfaces/models/game/tile';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Village } from 'app/interfaces/models/game/village';

const getImprovedUnitPower = (baseValue: number, baseUpkeep: number, level: number): number => {
  return baseValue + (baseValue + (300 * baseUpkeep) / 7) * (1.007 ** level - 1);
};

const getCombatantTileId = (units: Troop[]): Tile['id'] => {
  const { source } = units[0];
  return source;
};

const _getNpcVillageBonuses = (_village: Village) => {};

export type ResolveBattleArgs = {
  attackMode: 'attack' | 'raid';
  attackerEffects: Effect[];
  attackerUnits: Troop[];
  attackerHero: Hero;
  defenderEffects: Effect[];
  defenderUnits: Troop[];
  defenderVillage: Village;
};

export const resolveBattle = ({
  attackMode: _attackMode,
  attackerEffects,
  attackerUnits,
  attackerHero: _attackerHero,
  defenderEffects,
  defenderUnits,
  defenderVillage,
}: ResolveBattleArgs) => {
  const attackerVillageId = getCombatantTileId(attackerUnits);
  const defenderVillageId = defenderVillage.id;

  const { total: _attackerAttackBonus } = calculateComputedEffect('attackBonus', attackerEffects, attackerVillageId);

  const { total: _defenderInfantryDefence } = calculateComputedEffect('infantryDefence', defenderEffects, defenderVillageId);
  const { total: _defenderInfantryDefenceBonus } = calculateComputedEffect('infantryDefenceBonus', defenderEffects, defenderVillageId);
  const { total: _defenderCavalryDefence } = calculateComputedEffect('cavalryDefence', defenderEffects, defenderVillageId);
  const { total: _defenderCavalryDefenceBonus } = calculateComputedEffect('cavalryDefenceBonus', defenderEffects, defenderVillageId);

  const totalAttackerInfantryAttackPower = attackerUnits
    .filter(({ unitId }) => {
      const { category } = unitsMap.get(unitId)!;
      return category === 'infantry';
    })
    .reduce((totalAttack, { unitId, level, amount }) => {
      const { attack, cropConsumption } = unitsMap.get(unitId)!;
      return totalAttack + getImprovedUnitPower(attack, cropConsumption, level) * amount;
    }, 0);

  const totalAttackerCavalryAttackPower = attackerUnits
    .filter(({ unitId }) => {
      const { category } = unitsMap.get(unitId)!;
      return category === 'cavalry';
    })
    .reduce((totalAttack, { unitId, level, amount }) => {
      const { attack, cropConsumption } = unitsMap.get(unitId)!;
      return totalAttack + getImprovedUnitPower(attack, cropConsumption, level) * amount;
    }, 0);

  const totalAttackerAttackPower = totalAttackerInfantryAttackPower + totalAttackerCavalryAttackPower;
  const infantryAttackPowerRatio = totalAttackerInfantryAttackPower / totalAttackerAttackPower;
  const cavalryAttackPowerRatio = totalAttackerCavalryAttackPower / totalAttackerAttackPower;

  const totalDefenderInfantryDefencePower = defenderUnits
    .filter(({ unitId }) => {
      const { category } = unitsMap.get(unitId)!;
      return category === 'infantry';
    })
    .reduce((totalAttack, { unitId, level, amount }) => {
      const { infantryDefence, cropConsumption } = unitsMap.get(unitId)!;
      return totalAttack + getImprovedUnitPower(infantryDefence, cropConsumption, level) * amount;
    }, 0);

  const totalDefenderCavalryDefencePower = defenderUnits
    .filter(({ unitId }) => {
      const { category } = unitsMap.get(unitId)!;
      return category === 'cavalry';
    })
    .reduce((totalAttack, { unitId, level, amount }) => {
      const { cavalryDefence, cropConsumption } = unitsMap.get(unitId)!;
      return totalAttack + getImprovedUnitPower(cavalryDefence, cropConsumption, level) * amount;
    }, 0);

  const _totalDefenderDefencePower =
    totalDefenderInfantryDefencePower * infantryAttackPowerRatio + totalDefenderCavalryDefencePower * cavalryAttackPowerRatio;
};
