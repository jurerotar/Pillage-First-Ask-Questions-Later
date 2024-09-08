import { BuildingField } from 'app/[game]/[village]/components/building-field';
import { BuildingFieldTooltip } from 'app/[game]/components/building-field-tooltip';
import { Countdown } from 'app/[game]/components/countdown';
import { useGameNavigation } from 'app/[game]/hooks/routes/use-game-navigation';
import { useEvents } from 'app/[game]/hooks/use-events';
import { Tooltip } from 'app/components/tooltip';
import type { BuildingField as BuildingFieldType } from 'interfaces/models/game/village';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const BuildingUpgradeList = () => {
  const { t } = useTranslation();
  const { currentVillageBuildingEvents } = useEvents();

  return (
    <div className="">
      {currentVillageBuildingEvents.length > 0 && (
        <>
          {currentVillageBuildingEvents.map(({ building, resolvesAt, id, level }) => (
            <p
              className="flex gap-4"
              key={id}
            >
              <span>{t(`BUILDINGS.${building.id}.NAME`)}</span>
              <span>{t('GENERAL.LEVEL', { level })}</span>
              <Countdown endsAt={resolvesAt} />
            </p>
          ))}
        </>
      )}
    </div>
  );
};

const resourceViewBuildingFieldIds = [...Array(18)].map((_, i) => i + 1) as BuildingFieldType['id'][];
const villageViewBuildingFieldIds = [...Array(22)].map((_, i) => i + 19) as BuildingFieldType['id'][];

export const VillagePage: React.FC = () => {
  const { t } = useTranslation();
  const { isResourcesPageOpen, villagePath } = useGameNavigation();

  const _viewName = isResourcesPageOpen ? 'resources' : 'village';
  const buildingFieldIdsToDisplay = isResourcesPageOpen ? resourceViewBuildingFieldIds : villageViewBuildingFieldIds;

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
      <main className="mx-auto flex-col aspect-[16/9] min-w-[320px] max-w-5xl mt-16 md:mt-24">
        <div className="relative size-full">
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
              aria-label={t('APP.GAME.VILLAGE.BUILDING_FIELD.VILLAGE_LINK')}
            >
              Village
            </Link>
          )}
        </div>
        <BuildingUpgradeList />
      </main>
    </>
  );
};
