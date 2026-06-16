import type { NatureUnitId } from '@pillage-first/types/models/unit';

export const ANIMAL_CAGE_ITEM_ID = 1023;
export const ANIMAL_CAGE_COST = [250, 150, 350, 100];
export const ANIMAL_CAGE_BASE_DURATION = 10 * 60 * 1000;

export const HUNTERS_LODGE_HUNTING_PARTY_BASE_DURATION = 30 * 60 * 1000;

export const HUNTERS_LODGE_ANIMALS_BY_LEVEL = new Map<number, NatureUnitId[]>([
  [1, ['RAT', 'SPIDER', 'SERPENT']],
  [2, ['RAT', 'SPIDER', 'SERPENT', 'BAT', 'WILD_BOAR']],
  [3, ['RAT', 'SPIDER', 'SERPENT', 'BAT', 'WILD_BOAR', 'WOLF']],
  [4, ['RAT', 'SPIDER', 'SERPENT', 'BAT', 'WILD_BOAR', 'WOLF', 'BEAR']],
  [
    5,
    [
      'RAT',
      'SPIDER',
      'SERPENT',
      'BAT',
      'WILD_BOAR',
      'WOLF',
      'BEAR',
      'CROCODILE',
      'TIGER',
      'ELEPHANT',
    ],
  ],
]);

export const getHunterLodgeCatchableAnimals = (
  huntersLodgeLevel: number,
): NatureUnitId[] => {
  return HUNTERS_LODGE_ANIMALS_BY_LEVEL.get(
    Math.min(5, Math.max(1, huntersLodgeLevel)),
  )!;
};

export const calculateHuntersLodgeHuntCost = (
  huntingPartyLevel: number,
): number[] => {
  return [0, 0, 0, huntingPartyLevel * 100];
};

export const calculateHuntersLodgeHuntDuration = (
  huntingPartyLevel: number,
  serverSpeed: number,
): number => {
  return (
    (huntingPartyLevel * HUNTERS_LODGE_HUNTING_PARTY_BASE_DURATION) /
    serverSpeed
  );
};
