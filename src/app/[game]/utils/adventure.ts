import {
  HeroConsumableItemId,
  HeroHeadItemId,
  HeroItemCategory,
  HeroLeftHandItemId,
  HeroRightHandItemId,
  HeroTorsoItemId,
} from 'interfaces/models/game/hero';
import { randomIntFromInterval } from 'app/utils/common';

type ModifierFunction = (heroLevel: number) => number;

type AmountRoll<D> = {
  type: D;
  amount: ModifierFunction;
};

type TierRoll<D> = {
  type: D;
  tier: ModifierFunction;
};

const currencyLootTable = new Map<number, AmountRoll<'currency'>>([[1, { type: 'currency', amount: (heroLevel) => heroLevel * 10 }]]);

const troopLootTable = new Map<number, string>([
  [6, 'tier1'],
  [5, 'tier2'],
  [4, 'tier3'],
  [3, 'tier4'],
  [2, 'tier5'],
  [1, 'tier6'],
]);

const consumableLootTable = new Map<number, HeroConsumableItemId>([
  [7, 'OINTMENT'],
  [7, 'CAGE'],
  [3, 'EXPERIENCE_SCROLL'],
  [3, 'BOOK_OF_WISDOM'],
  [1, 'BUCKET'],
]);

const itemLootTable = new Map<number, TierRoll<HeroHeadItemId> | HeroTorsoItemId | HeroRightHandItemId | HeroLeftHandItemId>([]);

const lootCategoryTable = new Map<number, HeroItemCategory>([
  [10, 'resources'],
  [8, 'currency'],
  [7, 'consumables'],
  [4, 'troops'],
  [2, 'items'],
]);

const choose = <T>(lootTable: Map<number, T>): T => {
  const keys = [...lootTable.keys()];
  const weightSum = keys.reduce((a, b) => a + b, 0);
  const selectedNum = randomIntFromInterval(0, weightSum);
  const selection = keys.find((weight) => weight - selectedNum >= 0)!;
  return lootTable.get(selection)!;
};

export const rollLootTable = (heroLevel: number) => {
  const lootCategory = choose<HeroItemCategory>(lootCategoryTable);

  switch (lootCategory) {
    case 'consumables': {
    }
    case 'currency': {
    }
    case 'items': {
    }
    case 'resources': {
    }
    case 'troops': {
    }
  }
};
