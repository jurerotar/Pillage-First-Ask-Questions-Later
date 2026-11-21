import type { HeroItem } from '@pillage-first/types/models/hero-item';
import {
  mapResourceBundle,
  type ResourceBundle,
} from '@pillage-first/types/models/resource';
import type { PlayableTribe, Tribe } from '@pillage-first/types/models/tribe';
import {
  calculateProgressPercentage,
  roundToN,
} from '@pillage-first/utils/math';

const MAX_HERO_ATTRIBUTE_LEVEL = 99;

export const getHeroInitialStrength = (tribe: Tribe): number => {
  return tribe === 'romans' ? 100 : 80;
};

export const calculateHeroAttackPower = (
  tribe: Tribe,
  strengthPoints: number,
  equipmentPower: number,
): number => {
  return getHeroInitialStrength(tribe) * (1 + strengthPoints) + equipmentPower;
};

export const calculateHeroEquipmentBonuses = (
  equippedItems: readonly HeroItem[],
) => {
  const bonuses = {
    power: 0,
    speed: 0,
    damageReduction: 0,
    experienceModifier: 0,
    healthRegeneration: 0,
  };

  for (const item of equippedItems) {
    for (const bonus of item.heroBonus ?? []) {
      bonuses[bonus.attribute] += bonus.value;
    }
  }

  return bonuses;
};

export const calculateHeroAttributePoints = (level: number): number => {
  return (Math.min(level, MAX_HERO_ATTRIBUTE_LEVEL) + 1) * 4;
};

export const calculateHeroLevel = (currentExp: number) => {
  const k = currentExp / 25;
  const level = Math.floor((-1 + Math.sqrt(1 + 4 * k)) / 2);

  const currentLevelExp = level * (level + 1) * 25;
  const nextLevelExp = (level + 1) * (level + 2) * 25;

  const expToNextLevel = nextLevelExp - currentExp;
  const percentToNextLevel = Math.floor(
    calculateProgressPercentage(currentExp, currentLevelExp, nextLevelExp),
  );

  return {
    level,
    currentLevelExp,
    expToNextLevel,
    percentToNextLevel,
  };
};

const tribeToHeroRevivalCostMap = new Map<PlayableTribe, ResourceBundle>([
  ['romans', [130, 115, 180, 75]],
  ['teutons', [180, 130, 115, 75]],
  ['gauls', [115, 180, 130, 75]],
  ['egyptians', [115, 180, 130, 75]],
  ['huns', [180, 130, 115, 75]],
]);

export const calculateHeroRevivalCost = (
  tribe: PlayableTribe,
  level: number,
): ResourceBundle => {
  const baseRevivalCost = tribeToHeroRevivalCostMap.get(tribe)!;

  return mapResourceBundle(baseRevivalCost, (resource) =>
    roundToN(resource * (1 + level / 24) * (level + 1), 5),
  );
};

export const calculateHeroRevivalTime = (level: number): number => {
  const minutes = Math.min((level + 1) * 15, 6 * 60); // cap at 6 hours
  return minutes * 60 * 1000;
};

export const calculateHealthRegenerationInterval = (
  dailyHealthRegeneration: number,
  gameWorldSpeed: number,
): number => {
  const dayInMs = 24 * 60 * 60 * 1000;
  return dailyHealthRegeneration > 0
    ? Math.ceil(dayInMs / dailyHealthRegeneration / gameWorldSpeed)
    : 0;
};

export const getHeroHealthRegenerationDeadline = (
  health: number,
  nextHealthRegenerationAt: number | null,
  interval: number,
  elapsedTicks: number,
): number | null =>
  health > 0 &&
  health < 100 &&
  interval > 0 &&
  nextHealthRegenerationAt !== null
    ? nextHealthRegenerationAt + elapsedTicks * interval
    : null;

export const calculateHeroHealthAt = (
  health: number,
  nextHealthRegenerationAt: number | null,
  interval: number,
  timestamp: number,
): number => {
  if (
    health <= 0 ||
    health >= 100 ||
    interval <= 0 ||
    nextHealthRegenerationAt === null ||
    timestamp < nextHealthRegenerationAt
  ) {
    return health;
  }

  const ticks =
    1 + Math.floor((timestamp - nextHealthRegenerationAt) / interval);

  return Math.min(100, health + ticks);
};

export const getHeroHealthAt = (
  health: number,
  nextHealthRegenerationAt: number | null,
  interval: number,
  timestamp: number,
) => {
  const currentHealth = calculateHeroHealthAt(
    health,
    nextHealthRegenerationAt,
    interval,
    timestamp,
  );

  return {
    health: currentHealth,
    nextHealthRegenerationAt: getHeroHealthRegenerationDeadline(
      currentHealth,
      nextHealthRegenerationAt,
      interval,
      currentHealth - health,
    ),
  };
};
