import React from 'react';
import { useContextSelector } from 'use-context-selector';
import { ModalContext } from 'providers/global/modal-context';
import { BuildingField } from 'components/game/building-field';
import { Head } from 'components/common/head';

export const VillageView: React.FC = () => {
  const openModal = useContextSelector(ModalContext, (v) => v.openModal);

  return (
    <>
      <Head viewName="village" />
      <div>
        <BuildingField
          buildingFieldId="10"
          buildingId="CITY_WALL"
          buildingLevel={3}
        />
      </div>
    </>
  );
};
