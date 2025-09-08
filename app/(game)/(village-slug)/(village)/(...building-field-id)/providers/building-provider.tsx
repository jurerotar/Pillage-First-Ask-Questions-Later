import type { PropsWithChildren } from 'react';
import { createContext } from 'react';
import type { BuildingField } from 'app/interfaces/models/game/village';

type BuildingContextProps = {
  buildingField: BuildingField;
};

type BuildingContextReturn = BuildingField;

export const BuildingContext = createContext<BuildingContextReturn>(
  {} as never,
);

export const BuildingProvider = ({
  children,
  buildingField,
}: PropsWithChildren<BuildingContextProps>) => {
  return (
    <BuildingContext value={{ ...buildingField }}>{children}</BuildingContext>
  );
};
