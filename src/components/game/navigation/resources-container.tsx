import React from 'react';
import { useContextSelector } from 'use-context-selector';
import StockContainer from 'components/game/navigation/stock-container';
import { Resource } from 'interfaces/models/game/resource';
import { VillageContext } from 'providers/game/village-context';

const ResourcesContainer: React.FC = (): JSX.Element => {
  const lastUpdatedAt = useContextSelector(VillageContext, (v) => v.lastUpdatedAt);
  const resources = useContextSelector(VillageContext, (v) => v.resources);
  const storageCapacity = useContextSelector(VillageContext, (v) => v.storageCapacity);
  const hourlyProduction = useContextSelector(VillageContext, (v) => v.hourlyProduction);

  const resourceTypes: Resource[] = ['wood', 'clay', 'iron', 'wheat'];
  return (
    <div className="flex gap-2">
      {resourceTypes.map((resourceType: Resource, index: number) => (
        <StockContainer
          key={resourceType}
          resourceType={resourceType}
          lastKnownAmount={resources![resourceType]}
          hourlyProduction={hourlyProduction![resourceType]}
          storageCapacity={storageCapacity![resourceType]}
          updatedAt={lastUpdatedAt}
          hasBorder={index + 1 < resourceTypes.length}
        />
      ))}
    </div>
  );
};

export default ResourcesContainer;
