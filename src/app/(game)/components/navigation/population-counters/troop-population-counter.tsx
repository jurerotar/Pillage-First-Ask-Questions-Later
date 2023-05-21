import React from 'react';
import { useContextSelector } from 'use-context-selector';
import { VillageContext } from 'providers/game/village-context';
import { NavigationButton } from '../navigation-button';

export const TroopPopulationCounter: React.FC = () => {
  const troopPopulationCount = useContextSelector(VillageContext, (v) => v.troopPopulationCount);

  return (
    <div className="flex flex-col">
      <NavigationButton
        onClick={() => {}}
        variant="troop-count"
        size="sm"
      />
      <span className="duration-default text-center text-sm transition-colors dark:text-white">
        {troopPopulationCount}
      </span>
    </div>
  );
};
