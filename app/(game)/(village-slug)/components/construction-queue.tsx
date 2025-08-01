import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import type React from 'react';
import { use } from 'react';
import { FaLock } from 'react-icons/fa6';
import { ImHammer } from 'react-icons/im';
import { useTranslation } from 'react-i18next';
import { LuConstruction } from 'react-icons/lu';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { type PlacesType, Tooltip } from 'react-tooltip';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { IoIosArrowRoundForward } from 'react-icons/io';
import { MdCancel } from 'react-icons/md';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  eventsCacheKey,
  playerVillagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { isScheduledBuildingEvent } from 'app/(game)/guards/event-guards';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { faro } from '@grafana/faro-web-sdk';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

const iconClassName =
  'text-2xl lg:text-3xl bg-background text-gray-400 p-2 box-content border border-border rounded-xs';

type ConstructionQueueBuildingProps = {
  buildingEvent: GameEvent<'buildingConstruction'>;
  tooltipPosition: PlacesType;
};

const ConstructionQueueBuilding: React.FCWithChildren<
  ConstructionQueueBuildingProps
> = ({ buildingEvent, tooltipPosition }) => {
  const { t: assetsT } = useTranslation();
  const { t } = useTranslation();
  const isWiderThanMd = useMediaQuery('(min-width: 768px)');
  const { fetcher } = use(ApiContext);
  const queryClient = useQueryClient();

  const { mutate: cancelConstruction } = useMutation<
    void,
    Error,
    { eventId: GameEvent['id'] }
  >({
    mutationFn: async ({ eventId }) => {
      await fetcher(`/events/${eventId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [eventsCacheKey] });
      await queryClient.invalidateQueries({
        queryKey: [playerVillagesCacheKey],
      });
    },
  });

  const tooltipId = `tooltip-${buildingEvent.id}`;

  const isScheduledEvent = isScheduledBuildingEvent(buildingEvent);

  return (
    <>
      <div
        data-tooltip-id={tooltipId}
        className="flex flex-col relative cursor-pointer"
      >
        <LuConstruction className="text-2xl lg:text-3xl text-gray-400 bg-background px-2 pb-4 pt-0 box-content border border-border rounded-xs" />
        <Countdown
          className="absolute bottom-0 left-0 text-xs w-full leading-none bg-background border border-border text-center"
          endsAt={buildingEvent.startsAt + buildingEvent.duration}
        />
      </div>

      <Tooltip
        id={tooltipId}
        clickable
        className="!z-20 !rounded-xs !px-2 !py-1 !bg-background !w-fit !text-black border border-border"
        classNameArrow="border-r border-b border-border"
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
          <div className="flex md:hidden border-b-1 border-border pb-1 text-sm">
            <b>{t('Under construction')}</b>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center">
              <LuConstruction className="text-xl lg:text-2xl text-gray-400 box-content" />
            </div>
            <div className="flex flex-col px-2 border-x border-border">
              <span className="inline-flex gap-1 whitespace-nowrap">
                <b>{assetsT(`BUILDINGS.${buildingEvent.buildingId}.NAME`)}</b>
                <span className="inline-flex items-center text-sm">
                  ({buildingEvent.level - 1} <IoIosArrowRoundForward />{' '}
                  {buildingEvent.level})
                </span>
              </span>
              <span className="inline-flex gap-1 text-sm">
                <Countdown
                  endsAt={buildingEvent.startsAt + buildingEvent.duration}
                />
                {isScheduledEvent && <span>({t('In queue')})</span>}
              </span>
            </div>
            <div className="flex items-center">
              <button
                aria-label={t('Cancel building construction')}
                onClick={() =>
                  cancelConstruction({ eventId: buildingEvent.id })
                }
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

const ConstructionQueueEmptySlot: React.FCWithChildren<
  ConstructionQueueEmptySlotProps
> = ({ type }) => {
  if (type === 'free') {
    return <ImHammer className={iconClassName} />;
  }

  return <FaLock className={iconClassName} />;
};

export const ConstructionQueue = () => {
  const tribe = useTribe();
  const { shouldShowSidebars } = useGameLayoutState();
  const { currentVillageBuildingEvents } = use(
    CurrentVillageBuildingQueueContext,
  );

  if (!shouldShowSidebars) {
    return null;
  }

  const emptySlots =
    (tribe === 'romans' ? 2 : 1) - currentVillageBuildingEvents.length;

  // TODO: We've had reports of a bug where emptySlots is less than 0. We're manually reporting the issue, remove this code block once resolved.
  if (emptySlots < 0) {
    faro.api.pushError(
      new Error(
        'Invalid array length at ConstructionQueue' +
          JSON.stringify({ currentVillageBuildingEvents }),
      ),
    );
  }

  return (
    <ul className="fixed left-0 bottom-26 lg:bottom-14 flex lg:flex-col gap-1 bg-background/80 p-1 shadow-xs border-border rounded-l-none rounded-xs">
      {currentVillageBuildingEvents.map((event) => (
        <li key={event.id}>
          <ConstructionQueueBuilding
            tooltipPosition="right-start"
            buildingEvent={event}
          />
        </li>
      ))}

      {[...Array(emptySlots)].map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: It's fine here
        <li key={`empty-slot-${i}`}>
          <ConstructionQueueEmptySlot type="free" />
        </li>
      ))}
    </ul>
  );
};
