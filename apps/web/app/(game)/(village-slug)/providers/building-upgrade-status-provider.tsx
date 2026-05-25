import { createContext } from 'react';
import type { BorderIndicatorBorderVariant } from 'app/(game)/(village-slug)/components/border-indicator';

type BuildingUpgradeStatusContextReturn = {
  variant: BorderIndicatorBorderVariant;
  canUpgrade: boolean;
  errorBag: string[];
};

export const BuildingUpgradeStatusContext =
  createContext<BuildingUpgradeStatusContextReturn>(
    {} as BuildingUpgradeStatusContextReturn,
  );
