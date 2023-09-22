import React from 'react';
import { useContextSelector } from 'use-context-selector';
import { ModalContext } from 'providers/global/modal-context';
import { Head } from 'components/head';
import { BuildingField } from '../components/building-field';

export const VillagePage: React.FC = () => {
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
