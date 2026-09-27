import type { Building } from '@pillage-first/types/models/building';
import type { Server } from '@pillage-first/types/models/server';
import { calculateTotalCulturePointsForLevel } from './buildings';

export type CulturePointsCelebrationType = 'small' | 'large';

export type CulturePointsRequirementSpeed =
  Server['configuration']['culturePointsRequirementSpeed'];

const CULTURE_POINTS_REQUIREMENT_BASE = 2_000;
const CULTURE_POINTS_REQUIREMENT_GROWTH = 1.4;
const MAX_CULTURE_POINTS_REQUIREMENT_SPEED_FACTOR = 7;

export const CULTURE_POINTS_CELEBRATION_COSTS = {
  small: [6_400, 6_650, 5_940, 1_340],
  large: [29_700, 33_250, 32_000, 6_700],
} satisfies Record<CulturePointsCelebrationType, number[]>;

export const CULTURE_POINTS_CELEBRATION_LIMITS = {
  small: 500,
  large: 2_000,
} satisfies Record<CulturePointsCelebrationType, number>;

const CULTURE_POINTS_CELEBRATION_BASE_DURATIONS = {
  small: 24 * 60 * 60 * 1000,
  large: 60 * 60 * 60 * 1000,
} satisfies Record<CulturePointsCelebrationType, number>;

export const calculateCulturePointsForBuildingField = (
  buildingId: Building['id'],
  level: number,
): number => {
  return calculateTotalCulturePointsForLevel(buildingId, level);
};

export const calculateCulturePointsCelebrationDuration = ({
  celebrationType,
  townHallLevel,
  serverSpeed,
}: {
  celebrationType: CulturePointsCelebrationType;
  townHallLevel: number;
  serverSpeed: Server['configuration']['speed'];
}): number => {
  const baseDuration =
    CULTURE_POINTS_CELEBRATION_BASE_DURATIONS[celebrationType];
  const townHallModifier = 0.964 ** Math.max(0, townHallLevel - 1);

  return Math.ceil((baseDuration * townHallModifier) / serverSpeed);
};

const calculateCulturePointsRequirementSpeedFactor = (
  speed: CulturePointsRequirementSpeed,
): number => {
  return MAX_CULTURE_POINTS_REQUIREMENT_SPEED_FACTOR ** ((speed - 1) / 4);
};

export const calculateCulturePointsRequirementForVillageCount = (
  villageCount: number,
  speed: CulturePointsRequirementSpeed,
): number => {
  if (villageCount <= 1) {
    return 0;
  }

  const exponent =
    (villageCount - 2) * calculateCulturePointsRequirementSpeedFactor(speed);

  return Math.round(
    CULTURE_POINTS_REQUIREMENT_BASE *
      CULTURE_POINTS_REQUIREMENT_GROWTH ** exponent,
  );
};
