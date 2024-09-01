import { BuildingField } from 'app/[game]/[village]/components/building-field';
import { BuildingFieldTooltip } from 'app/[game]/components/building-field-tooltip';
import { useGameNavigation } from 'app/[game]/hooks/routes/use-game-navigation';
import { Tooltip } from 'app/components/tooltip';
import type { BuildingField as BuildingFieldType, ResourceFieldComposition } from 'interfaces/models/game/village';
import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const resourceFieldCompositions: ResourceFieldComposition[] = [
  '00018',
  '11115',
  '3339',
  '4437',
  '4347',
  '3447',
  '3456',
  '4356',
  '3546',
  '4536',
  '5346',
  '5436',
  '4446',
];

export const VillagePage: React.FC = () => {
  const { t } = useTranslation();
  const { isResourcesPageOpen, villagePath } = useGameNavigation();

  const [resourceFieldComposition, setResourceFieldComposition] = useState<ResourceFieldComposition>('4446');

  const _viewName = isResourcesPageOpen ? 'resources' : 'village';
  const buildingFieldIdsToDisplay = (
    isResourcesPageOpen ? [...Array(18)].map((_, i) => i + 1) : [...Array(22)].map((_, i) => i + 19)
  ) as BuildingFieldType['id'][];

  return (
    <>
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
      <main className="relative mx-auto flex aspect-[16/9] min-w-[320px] max-w-5xl mt-16 md:mt-24">
        {isResourcesPageOpen && (
          <select
            className="absolute top-0 left-0"
            onChange={(e) => setResourceFieldComposition(e.target.value as ResourceFieldComposition)}
          >
            {resourceFieldCompositions.map((e) => (
              <option
                key={e}
                value={e}
              >
                {e}
              </option>
            ))}
          </select>
        )}
        {buildingFieldIdsToDisplay.map((buildingFieldId) => (
          <BuildingField
            key={buildingFieldId}
            buildingFieldId={buildingFieldId}
            resourceFieldComposition={resourceFieldComposition}
          />
        ))}
        {isResourcesPageOpen && (
          <Link
            to={villagePath}
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-500"
            aria-label={t('APP.GAME.VILLAGE.BUILDING_FIELD.VILLAGE_LINK')}
          >
            Village
          </Link>
        )}
      </main>
    </>
  );
};
