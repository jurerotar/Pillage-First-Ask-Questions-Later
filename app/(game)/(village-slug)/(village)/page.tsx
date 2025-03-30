import { BuildingField } from 'app/(game)/(village-slug)/(village)/components/building-field';
import { BuildingFieldTooltip } from 'app/(game)/(village-slug)/components/building-field-tooltip';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { isScheduledBuildingEvent } from 'app/(game)/(village-slug)/hooks/guards/event-guards';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import { Icon } from 'app/components/icon';
import { Tooltip } from 'app/components/tooltip';
import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/village';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';

const BuildingUpgradeList = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();
  const { cancelBuildingEvent } = useEvents();

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
          <span className="font-medium">{assetsT(`BUILDINGS.${event.buildingId}.NAME`)}</span>
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
      <main className="flex flex-col items-center justify-center mx-auto lg:mt-20 lg:mb-0 max-h-[calc(100dvh-12rem)] standalone:max-h-[calc(100dvh-15rem)] h-screen lg:h-auto lg:max-h-none overflow-x-hidden">
        <div className="relative aspect-[16/10] scrollbar-hidden min-w-[460px] max-w-5xl w-full">
          {buildingFieldIdsToDisplay.map((buildingFieldId) => (
            <BuildingField
              key={buildingFieldId}
              buildingFieldId={buildingFieldId}
            />
          ))}
          {isResourcesPageOpen && (
            <Link
              to={villagePath}
              className="absolute text-xs lg:size-24 lg:text-sm left-1/2 top-1/2 size-14 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-500"
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
