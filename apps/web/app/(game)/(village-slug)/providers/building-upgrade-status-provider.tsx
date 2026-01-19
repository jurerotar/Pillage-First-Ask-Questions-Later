import { createContext, type PropsWithChildren } from 'react';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BorderIndicatorBorderVariant } from 'app/(game)/(village-slug)/components/border-indicator';
import { useBuildingUpgradeStatus } from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';

type BuildingUpgradeStatusContextReturn = {
  variant: BorderIndicatorBorderVariant;
  errors: string[];
};

export const BuildingUpgradeStatusContext =
  createContext<BuildingUpgradeStatusContextReturn>(
    {} as BuildingUpgradeStatusContextReturn,
  );

type BuildingUpgradeStatusContextProviderProps = PropsWithChildren<{
  buildingField: BuildingField;
}>;

export const BuildingUpgradeStatusContextProvider = ({
  buildingField,
  children,
}: BuildingUpgradeStatusContextProviderProps) => {
  const status = useBuildingUpgradeStatus(buildingField);

  return (
    <BuildingUpgradeStatusContext value={status}>
      {children}
    </BuildingUpgradeStatusContext>
  );
};
