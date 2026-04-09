import { createContext, type PropsWithChildren, useMemo } from 'react';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BorderIndicatorBorderVariant } from 'app/(game)/(village-slug)/components/border-indicator';
import { useBuildingConstructionErrorBag } from 'app/(game)/(village-slug)/hooks/use-building-construction-error-bag';

type BuildingUpgradeStatusContextReturn = {
  variant: BorderIndicatorBorderVariant;
  errorBag: string[];
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
  const { buildingId, level, id } = buildingField;

  const { errorBag, variant } = useBuildingConstructionErrorBag(
    buildingId,
    level,
    id,
  );

  const value = useMemo(() => {
    return {
      errorBag,
      variant,
    };
  }, [errorBag, variant]);

  return (
    <BuildingUpgradeStatusContext value={value}>
      {children}
    </BuildingUpgradeStatusContext>
  );
};
