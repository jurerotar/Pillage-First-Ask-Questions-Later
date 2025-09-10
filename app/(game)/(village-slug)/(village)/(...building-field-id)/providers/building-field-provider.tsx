import type { PropsWithChildren } from 'react';
import { createContext } from 'react';
import type { BuildingField } from 'app/interfaces/models/game/village';

type BuildingContextProps = {
  buildingFieldId: BuildingField['id'];
  buildingField: BuildingField | null;
};

type BuildingContextReturn = {
  buildingFieldId: BuildingField['id'];
  buildingField: BuildingField | null;
};

export const BuildingFieldContext = createContext<BuildingContextReturn>(
  {} as never,
);

export const BuildingFieldProvider = ({
  children,
  buildingField,
  buildingFieldId,
}: PropsWithChildren<BuildingContextProps>) => {
  return (
    <BuildingFieldContext value={{ buildingFieldId, buildingField }}>
      {children}
    </BuildingFieldContext>
  );
};
