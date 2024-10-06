import type {
  HeroConsumableItemId,
  HeroHeadItemId,
  HeroItemCategory,
  HeroLeftHandItemId,
  HeroRightHandItemId,
  HeroTorsoItemId,
} from 'app/interfaces/models/game/hero';
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

const _currencyLootTable = new Map<number, AmountRoll<'currency'>>([[1, { type: 'currency', amount: (heroLevel) => heroLevel * 10 }]]);

const _troopLootTable = new Map<number, string>([
  [6, 'tier1'],
  [5, 'tier2'],
  [4, 'tier3'],
  [3, 'tier4'],
  [2, 'tier5'],
  [1, 'tier6'],
]);

const _consumableLootTable = new Map<number, HeroConsumableItemId>([
  [7, 'OINTMENT'],
  [7, 'CAGE'],
  [3, 'EXPERIENCE_SCROLL'],
  [3, 'BOOK_OF_WISDOM'],
  [1, 'BUCKET'],
]);

const _itemLootTable = new Map<number, TierRoll<HeroHeadItemId> | HeroTorsoItemId | HeroRightHandItemId | HeroLeftHandItemId>([]);

const _lootCategoryTable = new Map<number, HeroItemCategory>([
  [10, 'resources'],
  [8, 'currency'],
  [7, 'consumables'],
  [4, 'troops'],
  [2, 'items'],
]);

const _choose = <T>(lootTable: Map<number, T>): T => {
  const keys = [...lootTable.keys()];
  const weightSum = keys.reduce((a, b) => a + b, 0);
  const selectedNum = randomIntFromInterval(0, weightSum);
  const selection = keys.find((weight) => weight - selectedNum >= 0)!;
  return lootTable.get(selection)!;
};
