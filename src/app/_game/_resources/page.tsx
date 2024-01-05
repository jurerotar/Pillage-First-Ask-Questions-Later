import React from 'react';
import { Head } from 'components/head';
import { useGameNavigation } from 'hooks/game/routes/use-game-navigation';
import { Link } from 'react-router-dom';
import { BuildingFieldId, ResourceFieldId } from 'interfaces/models/game/village';
import { Tooltip } from 'components/tooltip';
import { BuildingFieldTooltip } from 'app/_game/components/building-field-tooltip';
import { ResourceField } from './components/resource-field';

export const ResourcesPage: React.FC = () => {
  const { villagePath } = useGameNavigation();

  return (
    <>
      <Head viewName="resources" />
      <Tooltip
        anchorSelect="[data-building-field-id]"
        closeEvents={{
          mouseleave: true
        }}
        render={({ activeAnchor }) => {
          const buildingFieldIdAttribute = activeAnchor?.getAttribute('data-building-field-id');

          if (!buildingFieldIdAttribute) {
            return null;
          }

          const buildingFieldId = Number(buildingFieldIdAttribute) as BuildingFieldId;

          return <BuildingFieldTooltip buildingFieldId={buildingFieldId} />
        }}
      />
      <main className="relative mx-auto flex aspect-[16/9] min-w-[320px] max-w-[1000px]">
        {[...Array(18)].map((_, resourceBuildingFieldId) => (
          <ResourceField
            // eslint-disable-next-line react/no-array-index-key
            key={resourceBuildingFieldId}
            resourceFieldId={(resourceBuildingFieldId + 1) as ResourceFieldId}
          />
        ))}

        <Link
          to={villagePath}
          className="absolute left-[50%] top-[50%] flex size-[14.4%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-500"
        >
          Village
        </Link>
      </main>
    </>
  );
};
