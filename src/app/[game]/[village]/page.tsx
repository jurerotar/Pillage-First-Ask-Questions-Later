import React from 'react';
import { Head } from 'app/components/head';
import { BuildingField } from 'app/[game]/[village]/components/building-field';
import { BuildingFieldId, VillageFieldId } from 'interfaces/models/game/village';
import { Tooltip } from 'app/components/tooltip';
import { BuildingFieldTooltip } from 'app/[game]/components/building-field-tooltip';

export const VillagePage: React.FC = () => {
  return (
    <>
      <Head viewName="village" />
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
        {[...Array(22)].map((_, buildingFieldId) => (
          <BuildingField
            // eslint-disable-next-line react/no-array-index-key
            key={buildingFieldId}
            buildingFieldId={(buildingFieldId + 19) as VillageFieldId}
          />
        ))}
      </main>
    </>
  );
};
