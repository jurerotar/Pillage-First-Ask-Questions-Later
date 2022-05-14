import React from 'react';
import { useContextSelector } from 'use-context-selector';
import NavigationButton from 'components/game/navigation/navigation-button';
import { VillageContext } from 'providers/game/village-context';

const PopulationCounter: React.FC = (): JSX.Element => {
  const populationCount = useContextSelector(VillageContext, (v) => v.populationCount);

  return (
    <div className="flex flex-col">
      <NavigationButton
        onClick={() => {}}
        variant="troop-count"
        size="sm"
      />
      <span className="text-center text-sm">
        {populationCount}
      </span>
    </div>
  );
};

export default PopulationCounter;
