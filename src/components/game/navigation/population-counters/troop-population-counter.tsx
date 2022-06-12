import React from 'react';
import { useContextSelector } from 'use-context-selector';
import NavigationButton from 'components/game/navigation/navigation-button';
import { VillageContext } from 'providers/game/village-context';

const TroopPopulationCounter: React.FC = (): JSX.Element => {
  const troopPopulationCount = useContextSelector(VillageContext, (v) => v.troopPopulationCount);

  return (
    <div className="flex flex-col">
      <NavigationButton
        onClick={() => {}}
        variant="troop-count"
        size="sm"
      />
      <span className="text-center text-sm transition-colors duration-default dark:text-white">
        {troopPopulationCount}
      </span>
    </div>
  );
};

export default TroopPopulationCounter;
