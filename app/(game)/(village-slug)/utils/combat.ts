import type { Effect } from 'app/interfaces/models/game/effect';
import type { Hero } from 'app/interfaces/models/game/hero';
import type { Tile } from 'app/interfaces/models/game/tile';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Village } from 'app/interfaces/models/game/village';
import { getUnitData } from 'app/(game)/(village-slug)/utils/units';
import { calculateComputedEffect } from 'app/(game)/utils/calculate-computed-effect';

const getImprovedUnitPower = (
  baseValue: number,
  baseUpkeep: number,
  level: number,
): number => {
  return (
    baseValue + (baseValue + (300 * baseUpkeep) / 7) * (1.007 ** level - 1)
  );
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

  const { total: _attackerAttackBonus } = calculateComputedEffect(
    'attack',
    attackerEffects,
    attackerVillageId,
  );

  const { total: _defenderInfantryDefence } = calculateComputedEffect(
    'infantryDefence',
    defenderEffects,
    defenderVillageId,
  );
  const { total: _defenderInfantryDefenceBonus } = calculateComputedEffect(
    'infantryDefence',
    defenderEffects,
    defenderVillageId,
  );
  const { total: _defenderCavalryDefence } = calculateComputedEffect(
    'cavalryDefence',
    defenderEffects,
    defenderVillageId,
  );
  const { total: _defenderCavalryDefenceBonus } = calculateComputedEffect(
    'cavalryDefence',
    defenderEffects,
    defenderVillageId,
  );

  const totalAttackerInfantryAttackPower = attackerUnits
    .filter(({ unitId }) => {
      const { category } = getUnitData(unitId)!;
      return category === 'infantry';
    })
    .reduce((totalAttack, { unitId, amount }) => {
      const { attack, unitWheatConsumption } = getUnitData(unitId)!;
      return (
        totalAttack +
        getImprovedUnitPower(attack, unitWheatConsumption, 1) * amount
      );
    }, 0);

  const totalAttackerCavalryAttackPower = attackerUnits
    .filter(({ unitId }) => {
      const { category } = getUnitData(unitId)!;
      return category === 'cavalry';
    })
    .reduce((totalAttack, { unitId, amount }) => {
      const { attack, unitWheatConsumption } = getUnitData(unitId)!;
      return (
        totalAttack +
        getImprovedUnitPower(attack, unitWheatConsumption, 1) * amount
      );
    }, 0);

  const totalAttackerAttackPower =
    totalAttackerInfantryAttackPower + totalAttackerCavalryAttackPower;
  const infantryAttackPowerRatio =
    totalAttackerInfantryAttackPower / totalAttackerAttackPower;
  const cavalryAttackPowerRatio =
    totalAttackerCavalryAttackPower / totalAttackerAttackPower;

  const totalDefenderInfantryDefencePower = defenderUnits
    .filter(({ unitId }) => {
      const { category } = getUnitData(unitId)!;
      return category === 'infantry';
    })
    .reduce((totalAttack, { unitId, amount }) => {
      const { infantryDefence, unitWheatConsumption } = getUnitData(unitId)!;
      return (
        totalAttack +
        getImprovedUnitPower(infantryDefence, unitWheatConsumption, 1) * amount
      );
    }, 0);

  const totalDefenderCavalryDefencePower = defenderUnits
    .filter(({ unitId }) => {
      const { category } = getUnitData(unitId)!;
      return category === 'cavalry';
    })
    .reduce((totalAttack, { unitId, amount }) => {
      const { cavalryDefence, unitWheatConsumption } = getUnitData(unitId)!;
      return (
        totalAttack +
        getImprovedUnitPower(cavalryDefence, unitWheatConsumption, 1) * amount
      );
    }, 0);

  const _totalDefenderDefencePower =
    totalDefenderInfantryDefencePower * infantryAttackPowerRatio +
    totalDefenderCavalryDefencePower * cavalryAttackPowerRatio;
};
