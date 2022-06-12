import React from 'react';
import { useContextSelector } from 'use-context-selector';
import { ModalContext } from 'providers/modal-context';
import BuildingField from 'components/game/building-field';
import AppHelmet from 'components/common/head/app-helmet';

const VillageView: React.FC = (): JSX.Element => {
  const openModal = useContextSelector(ModalContext, (v) => v.openModal);

  return (
    <>
      {/* <AppHelmet viewName="village" /> */}
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

export default VillageView;
