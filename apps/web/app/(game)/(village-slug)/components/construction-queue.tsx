import { faro } from '@grafana/faro-web-sdk';
import { useClickOutside } from '@mantine/hooks';
import { type PropsWithChildren, Suspense, use, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImHammer } from 'react-icons/im';
import { IoIosArrowRoundForward } from 'react-icons/io';
import { LuChevronLeft, LuChevronRight, LuConstruction } from 'react-icons/lu';
import { MdCancel } from 'react-icons/md';
import { type PlacesType, Tooltip } from 'react-tooltip';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useCancelConstruction } from 'app/(game)/(village-slug)/hooks/use-cancel-construction';
import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import { useScheduledBuildingUpgrades } from 'app/(game)/(village-slug)/hooks/use-scheduled-building-upgrades';
import {
  type BuildingUpgradeQueueEntry,
  CurrentVillageBuildingQueueContext,
  getBuildingUpgradeQueueEntryKey,
} from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

const iconClassName =
  'text-2xl lg:text-3xl bg-background text-muted-foreground px-2 py-2.5 box-content border border-border rounded-xs transition-colors';

type ConstructionQueueBuildingProps = {
  buildingEvent: BuildingUpgradeQueueEntry;
  tooltipPosition: PlacesType;
};

const ConstructionQueueBuilding = ({
  buildingEvent,
  tooltipPosition,
}: PropsWithChildren<ConstructionQueueBuildingProps>) => {
  const { t } = useTranslation();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const { mutate: cancelConstruction } = useCancelConstruction();
  const { cancelScheduledBuildingUpgrade } = useScheduledBuildingUpgrades();

  const tooltipId = `construction-queue-tooltip-${getBuildingUpgradeQueueEntryKey(buildingEvent)}`;
  const tooltipKey = isWiderThanLg
    ? 'is-wider-than-lg'
    : 'is-not-wider-than-lg';

  const isScheduledEvent = buildingEvent.type === 'scheduledBuildingUpgrade';

  return (
    <>
      <div
        data-tooltip-id={tooltipId}
        className="flex flex-col relative cursor-pointer"
      >
        <LuConstruction className="text-2xl lg:text-3xl text-muted-foreground bg-background px-2.5 pb-4 pt-1 box-content border border-border rounded-xs transition-colors" />
        {!isScheduledEvent && (
          <Countdown
            className="absolute bottom-0 left-0 text-2xs w-full leading-none bg-background border border-border text-center transition-colors"
            endsAt={buildingEvent.startsAt + buildingEvent.duration}
          />
        )}
      </div>

      <Tooltip
        key={tooltipKey}
        id={tooltipId}
        clickable
        className="z-20! rounded-xs! px-2! py-1! bg-background! w-fit! text-foreground! border border-border transition-colors"
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
            <b>{isScheduledEvent ? t('In queue') : t('Under construction')}</b>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center">
              <LuConstruction className="text-xl lg:text-2xl text-muted-foreground box-content transition-colors" />
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
                {isScheduledEvent ? (
                  <span>{t('In queue')}</span>
                ) : (
                  <Countdown
                    endsAt={buildingEvent.startsAt + buildingEvent.duration}
                  />
                )}
              </span>
            </div>
            <div className="flex items-center">
              <button
                aria-label={t('Cancel building construction')}
                onClick={() => {
                  if (isScheduledEvent) {
                    cancelScheduledBuildingUpgrade({
                      scheduledUpgradeId: buildingEvent.id,
                    });
                    return;
                  }

                  cancelConstruction({ eventId: buildingEvent.id });
                }}
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

const ConstructionQueueEmptySlot = () => <ImHammer className={iconClassName} />;

const ConstructionQueueContent = () => {
  const { t } = useTranslation();
  const { buildingUpgradeEvents } = use(CurrentVillageBuildingQueueContext);
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const [isExtended, setIsExtended] = useState<boolean>(false);

  const containerRef = useClickOutside<HTMLUListElement>(() => {
    setIsExtended(false);
  });

  const totalSlotsCount = 5;
  const emptySlotsCount = Math.max(
    0,
    totalSlotsCount - buildingUpgradeEvents.length,
  );

  // TODO: We've had reports of a bug where emptySlots is less than 0. We're manually reporting the issue, remove this code block once resolved.
  if (totalSlotsCount - buildingUpgradeEvents.length < 0) {
    faro.api.pushError(
      new Error(
        'Invalid array length at ConstructionQueue' +
          JSON.stringify({ buildingUpgradeEvents }),
      ),
    );
  }

  const slots = [
    ...buildingUpgradeEvents.map((event) => ({
      type: 'building' as const,
      event,
    })),
    ...Array.from({ length: emptySlotsCount }, (_, i) => {
      const slotIndex = buildingUpgradeEvents.length + i;
      return {
        type: 'empty',
        id: `empty-slot-${slotIndex}`,
      } as const;
    }),
  ];

  return (
    <aside className="fixed left-0 bottom-safe-offset-26 lg:bottom-14 transition-all">
      <ul
        ref={containerRef}
        className="flex lg:flex-col gap-1 bg-background/80 p-1 shadow-xs border-border rounded-l-none rounded-xs items-center transition-all"
      >
        <li>
          {slots[0].type === 'building' ? (
            <ConstructionQueueBuilding
              tooltipPosition="right-start"
              buildingEvent={slots[0].event}
            />
          ) : (
            <ConstructionQueueEmptySlot />
          )}
        </li>

        {(isWiderThanLg || isExtended) &&
          slots.slice(1).map((slot) => (
            <li
              key={
                slot.type === 'building'
                  ? getBuildingUpgradeQueueEntryKey(slot.event)
                  : slot.id
              }
            >
              {slot.type === 'building' ? (
                <ConstructionQueueBuilding
                  tooltipPosition="right-start"
                  buildingEvent={slot.event}
                />
              ) : (
                <ConstructionQueueEmptySlot />
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
              className="text-2xl bg-muted text-muted-foreground py-2.5 box-content border border-border rounded-xs transition-colors"
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
