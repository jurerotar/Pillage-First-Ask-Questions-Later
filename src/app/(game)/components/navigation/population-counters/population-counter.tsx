import React from 'react';
import { useContextSelector } from 'use-context-selector';
import { VillageContext } from 'providers/game/village-context';
import { NavigationButton } from '../navigation-button';

export const PopulationCounter: React.FC = () => {
  const populationCount = useContextSelector(VillageContext, (v) => v.populationCount);

  return (
    <div className="flex flex-col">
      <NavigationButton
        onClick={() => {}}
        variant="population-count"
        size="sm"
      />
      <span className="duration-default text-center text-sm transition-colors dark:text-white">
        {populationCount}
      </span>
    </div>
  );
};
