import type { Tribe } from 'app/interfaces/models/game/tribe';
import { roundTo5 } from 'app/utils/common';
import type { QueryClient } from '@tanstack/react-query';
import type { Hero } from 'app/interfaces/models/game/hero';
import { heroCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const addHeroExperience = (queryClient: QueryClient, experience: number) => {
  queryClient.setQueryData<Hero>([heroCacheKey], (hero) => {
    hero!.stats.experience += experience;

    return {
      ...hero,
      stats: {
        ...hero!.stats,
        experience: hero!.stats.experience + experience,
      },
    } as Hero;
  });
};

export const calculateHeroLevel = (currentExp: number) => {
  const k = currentExp / 25;
  const level = Math.floor((-1 + Math.sqrt(1 + 4 * k)) / 2);

  const currentLevelExp = level * (level + 1) * 25;
  const nextLevelExp = (level + 1) * (level + 2) * 25;

  const expToNextLevel = nextLevelExp - currentExp;

  return {
    level,
    currentLevelExp,
    expToNextLevel,
  };
};

export const calculateHeroRevivalCost = (tribe: Tribe, level: number): number[] => {
  const tribeToHeroRevivalCostMap = new Map<Tribe, number[]>([
    ['romans', [130, 115, 180, 75]],
    ['teutons', [180, 130, 115, 75]],
    ['gauls', [115, 180, 130, 75]],
    ['egyptians', [115, 180, 130, 75]],
    ['huns', [180, 130, 115, 75]],
    ['spartans', [150, 150, 150, 75]],
    // TODO: Fill these in
    ['natars', [0, 0, 0, 0]],
    ['nature', [0, 0, 0, 0]],
  ]);

  const baseRevivalCost = tribeToHeroRevivalCostMap.get(tribe)!;

  return baseRevivalCost.map((resource) => roundTo5(resource * (1 + level / 24) * (level + 1)));
};

export const calculateHeroRevivalTime = (level: number): number => {
  const minutes = Math.min(level * 15, 6 * 60); // cap at 6 hours
  return minutes * 60 * 1000;
};
