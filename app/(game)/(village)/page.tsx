import { BuildingField } from 'app/(game)/(village)/components/building-field';
import { BuildingFieldTooltip } from 'app/(game)/components/building-field-tooltip';
import { Countdown } from 'app/(game)/components/countdown';
import { isScheduledBuildingEvent } from 'app/(game)/hooks/guards/event-guards';
import { useGameNavigation } from 'app/(game)/hooks/routes/use-game-navigation';
import { useEvents } from 'app/(game)/hooks/use-events';
import { Icon } from 'app/components/icon';
import { Tooltip } from 'app/components/tooltip';
import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/village';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { use } from 'react';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';

const BuildingUpgradeList = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { currentVillage } = use(CurrentVillageContext);
  const { getCurrentVillageBuildingEvents, cancelBuildingEvent } = useEvents();

  const currentVillageBuildingEvents = getCurrentVillageBuildingEvents(currentVillage);

  if (currentVillageBuildingEvents.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 flex-col">
      {currentVillageBuildingEvents.map((event, index) => (
        <p
          className="inline-flex gap-2 items-center"
          key={event.id}
        >
          <button
            type="button"
            onClick={() => cancelBuildingEvent(event.id)}
          >
            <Icon
              type="cancel"
              className="size-4"
            />
          </button>
          <span className="font-medium">{assetsT(`BUILDINGS.${event.building.id}.NAME`)}</span>
          <span className="text-orange-500">{t('level {{level}}', { level: event.level })}</span>
          <Countdown
            endsAt={
              event.startsAt +
              event.duration +
              +(isScheduledBuildingEvent(event) ? currentVillageBuildingEvents.at(index - 1)!.duration : 0)
            }
          />
          {isScheduledBuildingEvent(event) && <span className="text-gray-400">(Building queue)</span>}
        </p>
      ))}
    </div>
  );
};

const resourceViewBuildingFieldIds = [...Array(18)].map((_, i) => i + 1) as BuildingFieldType['id'][];
const villageViewBuildingFieldIds = [...Array(22)].map((_, i) => i + 19) as BuildingFieldType['id'][];

const VillagePage = () => {
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
      <main className="mx-auto flex-col aspect-[16/9] min-w-[320px] max-w-5xl mt-4 lg:mt-12 mb-16.5 lg:mb-0">
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
              aria-label={t('Village')}
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

export default VillagePage;
