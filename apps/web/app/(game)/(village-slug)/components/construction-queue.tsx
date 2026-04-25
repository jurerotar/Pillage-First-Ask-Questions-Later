import { faro } from '@grafana/faro-web-sdk';
import { useClickOutside } from '@mantine/hooks';
import { type PropsWithChildren, Suspense, use, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaLock } from 'react-icons/fa6';
import { ImHammer } from 'react-icons/im';
import { IoIosArrowRoundForward } from 'react-icons/io';
import { LuChevronLeft, LuChevronRight, LuConstruction } from 'react-icons/lu';
import { MdCancel } from 'react-icons/md';
import { type PlacesType, Tooltip } from 'react-tooltip';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import { isScheduledBuildingEvent } from '@pillage-first/utils/guards/event';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useCancelConstruction } from 'app/(game)/(village-slug)/hooks/use-cancel-construction';
import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import {
  type ScheduledBuildingUpgrade,
  useScheduledBuildingUpgrades,
} from 'app/(game)/(village-slug)/hooks/use-scheduled-building-upgrades';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

const iconClassName =
  'text-2xl lg:text-3xl bg-background text-muted-foreground px-2 py-2.5 box-content border border-border rounded-xs transition-colors';

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

  const { cancelConstruction } = useCancelConstruction();

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
        <LuConstruction className="text-2xl lg:text-3xl text-muted-foreground bg-background px-2.5 pb-4 pt-1 box-content border border-border rounded-xs transition-colors" />
        {!isScheduledEvent && (
          <Countdown
            className="absolute bottom-0 left-0 text-2xs w-full leading-none bg-background border border-border text-center transition-colors"
            endsAt={buildingEvent.startsAt + buildingEvent.duration}
          />
        )}
        {isScheduledEvent && (
          <span className="absolute bottom-0 left-0 text-2xs w-full leading-none bg-background border border-border text-center transition-colors">
            {t('In queue')}
          </span>
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
            <b>{t('Under construction')}</b>
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
                {!isScheduledEvent && (
                  <Countdown
                    endsAt={buildingEvent.startsAt + buildingEvent.duration}
                  />
                )}
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

type ConstructionQueueScheduledUpgradeProps = {
  upgrade: ScheduledBuildingUpgrade;
  tooltipPosition: PlacesType;
};

const ConstructionQueueScheduledUpgrade = ({
  upgrade,
  tooltipPosition,
}: PropsWithChildren<ConstructionQueueScheduledUpgradeProps>) => {
  const { t } = useTranslation();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const { removeScheduledBuildingUpgrade } = useScheduledBuildingUpgrades();

  const tooltipId = `tooltip-scheduled-${upgrade.id}`;
  const tooltipKey = isWiderThanLg
    ? 'is-wider-than-lg-scheduled'
    : 'is-not-wider-than-lg-scheduled';

  const levelUpgradingFrom = upgrade.level === 0 ? 0 : upgrade.level - 1;
  const levelUpgradingTo = upgrade.level === 0 ? 1 : upgrade.level;

  return (
    <>
      <div
        data-tooltip-id={tooltipId}
        className="flex flex-col relative cursor-pointer"
      >
        <LuConstruction className="text-2xl lg:text-3xl text-muted-foreground bg-background px-2.5 pb-4 pt-1 box-content border border-border rounded-xs transition-colors opacity-70" />
        <span className="absolute bottom-0 left-0 text-2xs w-full leading-none bg-background border border-border text-center transition-colors">
          {t('Scheduled')}
        </span>
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
            <b>{t('Scheduled upgrade')}</b>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center">
              <LuConstruction className="text-xl lg:text-2xl text-muted-foreground box-content transition-colors" />
            </div>
            <div className="flex flex-col px-2 border-x border-border">
              <span className="inline-flex gap-1 whitespace-nowrap">
                <b>{t(`BUILDINGS.${upgrade.buildingId}.NAME`)}</b>
                <span className="inline-flex items-center text-sm">
                  ({levelUpgradingFrom} <IoIosArrowRoundForward />{' '}
                  {levelUpgradingTo})
                </span>
              </span>
              <span className="inline-flex gap-1 text-sm">
                <span>({t('Scheduled')})</span>
              </span>
            </div>
            <div className="flex items-center">
              <button
                aria-label={t('Remove scheduled building upgrade')}
                onClick={() => {
                  removeScheduledBuildingUpgrade({
                    scheduledUpgradeId: upgrade.id,
                  });
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
  const { currentVillageBuildingEvents, scheduledBuildingUpgrades } = use(
    CurrentVillageBuildingQueueContext,
  );
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const [isExtended, setIsExtended] = useState<boolean>(false);

  const containerRef = useClickOutside<HTMLUListElement>(() => {
    setIsExtended(false);
  });

  const totalSlotsCount = 5;
  const availableSlotsCount = tribe === 'romans' ? 2 : 1;

  const totalOccupiedSlots =
    currentVillageBuildingEvents.length + scheduledBuildingUpgrades.length;

  const emptySlotsCount = Math.max(0, totalSlotsCount - totalOccupiedSlots);

  // TODO: We've had reports of a bug where emptySlots is less than 0. We're manually reporting the issue, remove this code block once resolved.
  if (totalSlotsCount - totalOccupiedSlots < 0) {
    faro.api.pushError(
      new Error(
        'Invalid array length at ConstructionQueue' +
          JSON.stringify({
            currentVillageBuildingEvents,
            scheduledBuildingUpgrades,
          }),
      ),
    );
  }

  const slots = [
    ...currentVillageBuildingEvents.map((event) => ({
      type: 'building' as const,
      event,
    })),
    ...scheduledBuildingUpgrades.map((upgrade) => ({
      type: 'scheduled' as const,
      upgrade,
    })),
    ...Array.from({ length: emptySlotsCount }, (_, i) => {
      const slotIndex = totalOccupiedSlots + i;
      const isFree = slotIndex < availableSlotsCount;

      return {
        type: 'empty',
        id: `empty-slot-${slotIndex}`,
        status: isFree ? 'free' : 'locked',
      } as const;
    }),
  ];

  return (
    <aside className="fixed left-0 bottom-26 lg:bottom-14 transition-all">
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
          ) : slots[0].type === 'scheduled' ? (
            <ConstructionQueueScheduledUpgrade
              tooltipPosition="right-start"
              upgrade={slots[0].upgrade}
            />
          ) : (
            <ConstructionQueueEmptySlot type={slots[0].status} />
          )}
        </li>

        {(isWiderThanLg || isExtended) &&
          slots.slice(1).map((slot) => (
            <li
              key={
                slot.type === 'building'
                  ? slot.event.id
                  : slot.type === 'scheduled'
                    ? `scheduled-${slot.upgrade.id}`
                    : slot.id
              }
            >
              {slot.type === 'building' ? (
                <ConstructionQueueBuilding
                  tooltipPosition="right-start"
                  buildingEvent={slot.event}
                />
              ) : slot.type === 'scheduled' ? (
                <ConstructionQueueScheduledUpgrade
                  tooltipPosition="right-start"
                  upgrade={slot.upgrade}
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
