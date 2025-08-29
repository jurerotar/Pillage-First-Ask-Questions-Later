import type React from 'react';
import { createContext } from 'react';
import type { BuildingField } from 'app/interfaces/models/game/building-field';

type BuildingContextProps = {
  buildingField: BuildingField;
};

type BuildingContextReturn = BuildingField;

export const BuildingContext = createContext<BuildingContextReturn>(
  {} as never,
);

export const BuildingProvider: React.FCWithChildren<BuildingContextProps> = ({
  children,
  buildingField,
}) => {
  return (
    <BuildingContext value={{ ...buildingField }}>{children}</BuildingContext>
  );
};
