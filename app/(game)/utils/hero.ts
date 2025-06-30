import type { Hero, HeroItem } from 'app/interfaces/models/game/hero';
import { getUnitData } from 'app/(game)/(village-slug)/utils/units';
import { itemsMap } from 'app/(game)/(village-slug)/assets/items';

export const assignHeroModelPropertiesToUnitModel = (hero: Hero): void => {
  const { tribe, selectableAttributes, equippedItems } = hero;
  const equippedItemIds: HeroItem['id'][] = Object.values(equippedItems).filter(
    (itemIdOrConsumableObject) => typeof itemIdOrConsumableObject === 'string',
  );

  const heroUnit = getUnitData('HERO');

  const heroPower = (() => {
    const baseAttackPower = 100;
    // Roman hero is stronger
    const attackPowerModifier = tribe === 'romans' ? 100 : 80;

    const bonusAttackPower = equippedItemIds.reduce((total, itemId) => {
      const item = itemsMap.get(itemId)!;
      if (!item?.heroBonus) {
        return total;
      }

      return (
        item.heroBonus.find(({ attribute }) => attribute === 'power')?.value ??
        0
      );
    }, 0);

    return (
      baseAttackPower +
      bonusAttackPower +
      selectableAttributes.attackPower * attackPowerModifier
    );
  })();

  const heroSpeed = (() => {
    const baseHeroSpeed = 7;
    const hasHorseEquipped = hero.equippedItems.horse !== null;

    const bonusSpeed = equippedItemIds.reduce((total, itemId) => {
      const item = itemsMap.get(itemId)!;
      if (!item?.heroBonus) {
        return total;
      }

      return (
        item.heroBonus.find(({ attribute }) => attribute === 'speed')?.value ??
        0
      );
    }, 0);

    const calculatedHeroSpeed =
      baseHeroSpeed + (hasHorseEquipped ? bonusSpeed : 0);

    if (tribe === 'gauls') {
      // Gaul hero is faster when on horse
      return hasHorseEquipped ? calculatedHeroSpeed + 5 : calculatedHeroSpeed;
    }

    return calculatedHeroSpeed;
  })();

  heroUnit.unitSpeed = heroSpeed;
  heroUnit.attack = heroPower;
  heroUnit.infantryDefence = heroPower;
  heroUnit.cavalryDefence = heroPower;
};
