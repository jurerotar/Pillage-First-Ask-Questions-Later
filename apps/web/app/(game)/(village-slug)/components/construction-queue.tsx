import { faro } from '@grafana/faro-web-sdk';
import { useClickOutside } from '@mantine/hooks';
import { useMutation } from '@tanstack/react-query';
import { type PropsWithChildren, Suspense, use, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaLock } from 'react-icons/fa6';
import { ImHammer } from 'react-icons/im';
import { IoIosArrowRoundForward } from 'react-icons/io';
import { LuChevronLeft, LuChevronRight, LuConstruction } from 'react-icons/lu';
import { MdCancel } from 'react-icons/md';
import { type PlacesType, Tooltip } from 'react-tooltip';
import type {
  BuildingEvent,
  GameEvent,
} from '@pillage-first/types/models/game-event';
import { isScheduledBuildingEvent } from '@pillage-first/utils/guards/event';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import {
  eventsCacheKey,
  playerVillagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import { ApiContext } from 'app/(game)/providers/api-provider';

const iconClassName =
  'text-2xl lg:text-3xl bg-background text-gray-400 px-2 py-2.5 box-content border border-border rounded-xs';

type ConstructionQueueBuildingProps = {
  buildingEvent: BuildingEvent;
  tooltipPosition: PlacesType;
};

const ConstructionQueueBuilding = ({
  buildingEvent,
  tooltipPosition,
}: PropsWithChildren<ConstructionQueueBuildingProps>) => {
  const { t } = useTranslation();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const { fetcher } = use(ApiContext);

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
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await context.client.invalidateQueries({ queryKey: [eventsCacheKey] });
      await context.client.invalidateQueries({
        queryKey: [playerVillagesCacheKey],
      });
    },
  });

  const tooltipId = `tooltip-${buildingEvent.id}`;
  const tooltipKey = isWiderThanLg
    ? 'is-wider-than-lg'
    : 'is-not-wider-than-lg';

  const isScheduledEvent = isScheduledBuildingEvent(buildingEvent);

  return (
    <>
      <div
        data-tooltip-id={tooltipId}
        className="flex flex-col relative cursor-pointer"
      >
        <LuConstruction className="text-2xl lg:text-3xl text-gray-400 bg-background px-2.5 pb-4 pt-1 box-content border border-border rounded-xs" />
        <Countdown
          className="absolute bottom-0 left-0 text-2xs w-full leading-none bg-background border border-border text-center"
          endsAt={buildingEvent.startsAt + buildingEvent.duration}
        />
      </div>

      <Tooltip
        key={tooltipKey}
        id={tooltipId}
        clickable
        className="z-20! rounded-xs! px-2! py-1! bg-background! w-fit! text-black! border border-border"
        classNameArrow="border-r border-b border-border"
        place={tooltipPosition}
        {...(isWiderThanLg && {
          isOpen: true,
        })}
        {...(!isWiderThanLg && {
          openOnClick: true,
          place: 'top-start',
        })}
      >
        <div className="flex flex-col gap-2">
          <div className="flex md:hidden border-b border-border pb-1 text-sm">
            <b>{t('Under construction')}</b>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center">
              <LuConstruction className="text-xl lg:text-2xl text-gray-400 box-content" />
            </div>
            <div className="flex flex-col px-2 border-x border-border">
              <span className="inline-flex gap-1 whitespace-nowrap">
                <b>{t(`BUILDINGS.${buildingEvent.buildingId}.NAME`)}</b>
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

const ConstructionQueueEmptySlot = ({
  type,
}: PropsWithChildren<ConstructionQueueEmptySlotProps>) => {
  if (type === 'free') {
    return <ImHammer className={iconClassName} />;
  }

  return <FaLock className={iconClassName} />;
};

const ConstructionQueueContent = () => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { currentVillageBuildingEvents } = use(
    CurrentVillageBuildingQueueContext,
  );
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const [isExtended, setIsExtended] = useState<boolean>(false);

  const containerRef = useClickOutside<HTMLUListElement>(() => {
    setIsExtended(false);
  });

  const totalSlotsCount = 5;
  const availableSlotsCount = tribe === 'romans' ? 2 : 1;

  const emptySlotsCount = Math.max(
    0,
    totalSlotsCount - currentVillageBuildingEvents.length,
  );

  // TODO: We've had reports of a bug where emptySlots is less than 0. We're manually reporting the issue, remove this code block once resolved.
  if (totalSlotsCount - currentVillageBuildingEvents.length < 0) {
    faro.api.pushError(
      new Error(
        'Invalid array length at ConstructionQueue' +
          JSON.stringify({ currentVillageBuildingEvents }),
      ),
    );
  }

  const slots = [
    ...currentVillageBuildingEvents.map((event) => ({
      type: 'building' as const,
      event,
    })),
    ...Array.from({ length: emptySlotsCount }, (_, i) => {
      const slotIndex = currentVillageBuildingEvents.length + i;
      const isFree = slotIndex < availableSlotsCount;

      return {
        type: 'empty',
        id: `empty-slot-${slotIndex}`,
        status: isFree ? 'free' : 'locked',
      } as const;
    }),
  ];

  return (
    <aside className="fixed left-0 bottom-26 lg:bottom-14">
      <ul
        ref={containerRef}
        className="flex lg:flex-col gap-1 bg-background/80 p-1 shadow-xs border-border rounded-l-none rounded-xs items-center"
      >
        <li>
          {slots[0].type === 'building' ? (
            <ConstructionQueueBuilding
              tooltipPosition="right-start"
              buildingEvent={slots[0].event}
            />
          ) : (
            <ConstructionQueueEmptySlot type={slots[0].status} />
          )}
        </li>

        {(isWiderThanLg || isExtended) &&
          slots.slice(1).map((slot) => (
            <li key={slot.type === 'building' ? slot.event.id : slot.id}>
              {slot.type === 'building' ? (
                <ConstructionQueueBuilding
                  tooltipPosition="right-start"
                  buildingEvent={slot.event}
                />
              ) : (
                <ConstructionQueueEmptySlot type={slot.status} />
              )}
            </li>
          ))}

        {!isWiderThanLg && (
          <li>
            <button
              aria-label={
                isExtended
                  ? t('Close construction queue')
                  : t('Expand construction queue')
              }
              className="text-2xl bg-muted text-gray-400 py-2.5 box-content border border-border rounded-xs"
              onClick={() => setIsExtended(!isExtended)}
              type="button"
            >
              {isExtended ? <LuChevronLeft /> : <LuChevronRight />}
            </button>
          </li>
        )}
      </ul>
    </aside>
  );
};

export const ConstructionQueue = () => {
  const { shouldShowSidebars } = useGameLayoutState();

  if (!shouldShowSidebars) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ConstructionQueueContent />
    </Suspense>
  );
};
