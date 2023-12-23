import React from 'react';
import { Head } from 'components/head';
import { useCurrentVillage } from 'hooks/game/use-current-village';

export const VillagePage: React.FC = () => {
  const { currentVillage } = useCurrentVillage();

  return (
    <Head
      viewName="village"
      tFunctionArgs={{
        currentVillageName: currentVillage.name
      }}
    />
  );
};
