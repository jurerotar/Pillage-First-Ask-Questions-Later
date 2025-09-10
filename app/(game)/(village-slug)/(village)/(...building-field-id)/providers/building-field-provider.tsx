import type { PropsWithChildren } from 'react';
import { createContext } from 'react';
import type { BuildingField } from 'app/interfaces/models/game/village';

type BuildingContextProps = {
  buildingField: BuildingField;
};

type BuildingContextReturn = BuildingField;

export const BuildingFieldContext = createContext<BuildingContextReturn>(
  {} as never,
);

export const BuildingFieldProvider = ({
  children,
  buildingField,
}: PropsWithChildren<BuildingContextProps>) => {
  return (
    <BuildingFieldContext value={buildingField}>
      {children}
    </BuildingFieldContext>
  );
};
