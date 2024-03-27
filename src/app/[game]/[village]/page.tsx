import React from 'react';
import { Head } from 'app/components/head';
import { BuildingField } from 'app/[game]/[village]/components/building-field';
import { BuildingField as BuildingFieldType } from 'interfaces/models/game/village';
import { Tooltip } from 'app/components/tooltip';
import { BuildingFieldTooltip } from 'app/[game]/components/building-field-tooltip';
import { useGameNavigation } from 'app/[game]/hooks/routes/use-game-navigation';
import { Link } from 'react-router-dom';

export const VillagePage: React.FC = () => {
  const { isResourcesPageOpen, villagePath } = useGameNavigation();

  const viewName = isResourcesPageOpen ? 'resources' : 'village';
  const buildingFieldIdsToDisplay = (
    isResourcesPageOpen ? [...Array(18)].map((_, i) => i + 1) : [...Array(22)].map((_, i) => i + 19)
  ) as BuildingFieldType['id'][];

  return (
    <>
      <Head viewName={viewName} />
      <Tooltip
        anchorSelect="[data-building-field-id]"
        closeEvents={{
          mouseleave: true,
        }}
        render={({ activeAnchor }) => {
          const buildingFieldIdAttribute = activeAnchor?.getAttribute('data-building-field-id');

          if (!buildingFieldIdAttribute) {
            return null;
          }

          const buildingFieldId = Number(buildingFieldIdAttribute) as BuildingFieldType['id'];

          return <BuildingFieldTooltip buildingFieldId={buildingFieldId} />;
        }}
      />
      <main className="relative mx-auto flex aspect-[16/9] min-w-[320px] max-w-[1000px] mt-16 md:mt-24">
        {buildingFieldIdsToDisplay.map((buildingFieldId) => (
          <BuildingField
            key={buildingFieldId}
            buildingFieldId={buildingFieldId}
          />
        ))}
        {isResourcesPageOpen && (
          <Link
            to={villagePath}
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-500"
          >
            Village
          </Link>
        )}
      </main>
    </>
  );
};
