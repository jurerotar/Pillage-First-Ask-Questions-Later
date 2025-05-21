import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import { useCurrentVillageBuildingEventQueue } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-event-queue';
import type React from 'react';
import { FaLock } from 'react-icons/fa6';
import { ImHammer } from 'react-icons/im';
import { useTranslation } from 'react-i18next';
import { LuConstruction } from 'react-icons/lu';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { type PlacesType, Tooltip } from 'react-tooltip';
import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { IoIosArrowRoundForward } from 'react-icons/io';
import { MdCancel } from 'react-icons/md';

const iconClassName = 'text-2xl lg:text-3xl bg-white text-gray-400 p-2 box-content border border-gray-200 rounded-xs';

type ConstructionQueueBuildingProps = {
  buildingEvent: GameEvent<'buildingLevelChange'>;
  tooltipPosition: PlacesType;
};

const ConstructionQueueBuilding: React.FCWithChildren<ConstructionQueueBuildingProps> = ({ buildingEvent, tooltipPosition }) => {
  const { t: assetsT } = useTranslation();
  const { t } = useTranslation();
  const { cancelBuildingEvent } = useEvents();
  const isWiderThanMd = useMediaQuery('(min-width: 768px)');

  const tooltipId = `tooltip-${buildingEvent.buildingId}-${buildingEvent.level}`;

  return (
    <>
      <div
        data-tooltip-id={tooltipId}
        className="flex flex-col relative cursor-pointer"
      >
        <LuConstruction className="text-2xl lg:text-3xl text-gray-400 bg-white px-2 pb-4 pt-0 box-content border border-gray-200 rounded-xs" />
        <Countdown
          className="absolute bottom-0 left-0 text-xs w-full leading-none bg-white border border-gray-200 text-center"
          endsAt={buildingEvent.startsAt + buildingEvent.duration}
        />
      </div>

      <Tooltip
        id={tooltipId}
        clickable
        className="!z-20 !rounded-xs !px-2 !py-1 !bg-white !w-fit !text-black border border-gray-200"
        classNameArrow="border-r border-b border-gray-200"
        place={tooltipPosition}
        {...(isWiderThanMd && {
          isOpen: true,
        })}
        {...(!isWiderThanMd && {
          openOnClick: true,
          place: 'top-start',
        })}
      >
        <div className="flex flex-col gap-2">
          <div className="flex md:hidden border-b-1 border-gray-200 pb-1 text-sm">
            <b>{t('Under construction')}</b>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center">
              <LuConstruction className="text-xl lg:text-2xl text-gray-400 box-content" />
            </div>
            <div className="flex flex-col px-2 border-x border-gray-200">
              <span className="inline-flex gap-1 whitespace-nowrap">
                <b>{assetsT(`BUILDINGS.${buildingEvent.buildingId}.NAME`)}</b>
                <span className="inline-flex items-center text-sm">
                  ({buildingEvent.level - 1} <IoIosArrowRoundForward /> {buildingEvent.level})
                </span>
              </span>
              <span className="text-sm">
                <Countdown endsAt={buildingEvent.startsAt + buildingEvent.duration} />
              </span>
            </div>
            <div className="flex items-center">
              <button
                aria-label={t('Cancel building construction')}
                onClick={() => cancelBuildingEvent(buildingEvent.id)}
                type="button"
              >
                <MdCancel className="text-xl lg:text-2xl text-red-400 box-content" />
              </button>
            </div>
          </div>
        </div>
      </Tooltip>
    </>
  );
};

type ConstructionQueueEmptySlotProps = {
  type: 'free' | 'locked';
};

const ConstructionQueueEmptySlot: React.FCWithChildren<ConstructionQueueEmptySlotProps> = ({ type }) => {
  if (type === 'free') {
    return <ImHammer className={iconClassName} />;
  }

  return <FaLock className={iconClassName} />;
};

export const ConstructionQueue = () => {
  const { tribe } = useTribe();
  const { shouldShowSidebars } = useGameLayoutState();

  // We need 2 of them because romans have 2 separate ones
  const { currentVillageBuildingEventsQueue: resourcesEventQueue } = useCurrentVillageBuildingEventQueue(1);
  const { currentVillageBuildingEventsQueue: villageEventQueue } = useCurrentVillageBuildingEventQueue(19);

  if (!shouldShowSidebars) {
    return null;
  }

  return (
    <ul className="fixed left-0 bottom-26 lg:bottom-14 flex lg:flex-col gap-1 bg-white/80 p-1 shadow-xs border-gray-100 rounded-l-none rounded-xs">
      {tribe !== 'romans' && (
        <li>
          {villageEventQueue.length > 0 && (
            <ConstructionQueueBuilding
              tooltipPosition="right-start"
              buildingEvent={villageEventQueue[0]}
            />
          )}
          {villageEventQueue.length === 0 && <ConstructionQueueEmptySlot type="free" />}
        </li>
      )}
      {tribe === 'romans' && (
        <>
          <li>
            {resourcesEventQueue.length > 0 && (
              <ConstructionQueueBuilding
                tooltipPosition="right-end"
                buildingEvent={resourcesEventQueue[0]}
              />
            )}
            {resourcesEventQueue.length === 0 && <ConstructionQueueEmptySlot type="free" />}
          </li>
          <li>
            {villageEventQueue.length > 0 && (
              <ConstructionQueueBuilding
                tooltipPosition="right-start"
                buildingEvent={villageEventQueue[0]}
              />
            )}
            {villageEventQueue.length === 0 && <ConstructionQueueEmptySlot type="free" />}
          </li>
        </>
      )}
      {/* TODO: Uncomment and finish whenever you get scheduled events working again! */}
      {/*{tribe !== 'romans' && (*/}
      {/*  <li>*/}
      {/*    <ConstructionQueueEmptySlot type="locked" />*/}
      {/*  </li>*/}
      {/*)}*/}
      {/*<li>*/}
      {/*  <ConstructionQueueEmptySlot type="locked" />*/}
      {/*</li>*/}
      {/*<li>*/}
      {/*  <ConstructionQueueEmptySlot type="locked" />*/}
      {/*</li>*/}
      {/*<li>*/}
      {/*  <ConstructionQueueEmptySlot type="locked" />*/}
      {/*</li>*/}
    </ul>
  );
};
