import { calculateCulturePointsRequirementForVillageCount } from '@pillage-first/game-assets/utils/culture-points';
import { useCountdown } from 'app/(game)/(village-slug)/hooks/use-countdown';
import { useCulturePoints } from 'app/(game)/(village-slug)/hooks/use-culture-points';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';

export const useCulturePointsProgress = () => {
  const now = useCountdown();
  const { server } = useServer();
  const { culturePoints, culturePointsUpdatedAt } = useCulturePoints();

  const { playerCulturePointsProduction: dailyProduction } = culturePoints;

  const availableCulturePoints =
    culturePoints.culturePoints +
    ((Math.max(0, now - culturePointsUpdatedAt) * dailyProduction) / 24) *
      60 *
      60 *
      1000;

  let availableVillageCount = 1;

  while (
    calculateCulturePointsRequirementForVillageCount(
      availableVillageCount + 1,
      server.configuration.culturePointsRequirementSpeed,
    ) <= availableCulturePoints
  ) {
    availableVillageCount += 1;
  }

  const previousRequirement = calculateCulturePointsRequirementForVillageCount(
    availableVillageCount,
    server.configuration.culturePointsRequirementSpeed,
  );

  const nextRequirement = calculateCulturePointsRequirementForVillageCount(
    availableVillageCount + 1,
    server.configuration.culturePointsRequirementSpeed,
  );

  const progress =
    nextRequirement > previousRequirement
      ? Math.min(
          100,
          Math.max(
            0,
            ((availableCulturePoints - previousRequirement) /
              (nextRequirement - previousRequirement)) *
              100,
          ),
        )
      : 100;

  return {
    culturePoints,
    dailyProduction,
    availableCulturePoints,
    availableVillageCount,
    previousRequirement,
    nextRequirement,
    progress,
  };
};
