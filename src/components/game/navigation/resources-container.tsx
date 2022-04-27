import React from 'react';
import { useContextSelector } from 'use-context-selector';
import { GameContext } from 'providers/game-context';
import StockContainer from 'components/game/navigation/stock-container';
import { Resource } from 'interfaces/models/game/resources';

const ResourcesContainer: React.FC = (): JSX.Element => {
  const lastUpdatedAt = useContextSelector(GameContext, (v) => v.lastUpdatedAt);
  const resources = useContextSelector(GameContext, (v) => v.resources);
  const storageCapacity = useContextSelector(GameContext, (v) => v.storageCapacity);
  const hourlyProduction = useContextSelector(GameContext, (v) => v.hourlyProduction);

  const resourceTypes: Resource[] = ['wood', 'clay', 'iron', 'wheat'];

  return (
    <div className="flex">
      {resourceTypes.map((resourceType: Resource) => (
        <StockContainer
          resourceType={resourceType}
          lastKnownAmount={resources[resourceType]}
          hourlyProduction={hourlyProduction[resourceType]}
          storageCapacity={storageCapacity[resourceType]}
          updatedAt={lastUpdatedAt}
        />
      ))}
    </div>
  );
};

export default ResourcesContainer;
