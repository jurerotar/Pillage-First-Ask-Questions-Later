import type React from 'react';
import { useCallback } from 'react';
import { createContext } from 'react';
import { useVillages } from 'app/(game)/hooks/use-villages';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import type { Village } from 'app/interfaces/models/game/village';
import type { Point } from 'app/interfaces/models/common';
import { calculateDistanceBetweenPoints, roundTo2DecimalPoints } from 'app/utils/common';

type CurrentVillageContextReturn = {
  currentVillage: Village;
  distanceFromCurrentVillage: (tileCoordinates: Point) => number;
};

export const CurrentVillageContext = createContext<CurrentVillageContextReturn>({} as never);

export const CurrentVillageProvider: React.FCWithChildren = ({ children }) => {
  const { getPlayerVillages } = useVillages();
  const { villageSlug } = useRouteSegments();

  const playerVillages = getPlayerVillages();
  const currentVillage = playerVillages.find(({ slug }) => slug === villageSlug);

  const distanceFromCurrentVillage = useCallback(
    (tileCoordinates: Point): number => {
      return roundTo2DecimalPoints(calculateDistanceBetweenPoints(currentVillage!.coordinates, tileCoordinates));
    },
    [currentVillage],
  );

  const value = {
    currentVillage: currentVillage!,
    distanceFromCurrentVillage,
  };

  return <CurrentVillageContext value={value}>{children}</CurrentVillageContext>;
};
