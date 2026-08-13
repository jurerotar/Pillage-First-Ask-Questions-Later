import { faro } from '@grafana/faro-web-sdk';
import { useClickOutside } from '@mantine/hooks';
import clsx from 'clsx';
import { Suspense, use, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImHammer } from 'react-icons/im';
import { IoIosArrowRoundForward } from 'react-icons/io';
import {
  LuChevronLeft,
  LuChevronRight,
  LuConstruction,
  LuGripVertical,
} from 'react-icons/lu';
import { MdCancel } from 'react-icons/md';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useCancelConstruction } from 'app/(game)/(village-slug)/hooks/use-cancel-construction';
import {
  type ConstructionQueueDragHandlers,
  useConstructionQueueDrag,
} from 'app/(game)/(village-slug)/hooks/use-construction-queue-drag';
import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import {
  type ScheduledBuildingUpgrade,
  useScheduledBuildingUpgrades,
} from 'app/(game)/(village-slug)/hooks/use-scheduled-building-upgrades';
import {
  type BuildingUpgradeQueueEntry,
  CurrentVillageBuildingQueueContext,
  getBuildingUpgradeQueueEntryKey,
} from 'app/(game)/(village-slug)/providers/current-village-building-queue-context';

const iconClassName =
  'text-2xl lg:text-3xl bg-background text-muted-foreground px-2 py-2.5 box-content border border-border rounded-xs transition-colors';

type DropTargetStatus = 'valid' | 'invalid';

type ConstructionQueueBuildingProps = {
  buildingEvent: BuildingUpgradeQueueEntry;
  isDragging?: boolean;
  dragHandlers?: ConstructionQueueDragHandlers;
  dropTargetStatus?: DropTargetStatus;
  onCancel: (buildingEvent: BuildingUpgradeQueueEntry) => void;
};

const ConstructionQueueBuilding = ({
  buildingEvent,
  isDragging = false,
  dragHandlers,
  dropTargetStatus,
  onCancel,
}: ConstructionQueueBuildingProps) => {
  const { t } = useTranslation();
  const isScheduledEvent = buildingEvent.type === 'scheduledBuildingUpgrade';

  return (
    <div
      className={clsx(
        'relative flex items-center gap-2 overflow-hidden rounded-tr rounded-br border-r border-t border-b border-border bg-background px-2 py-1 shadow-xs transition-opacity non-selectable',
        isDragging && 'opacity-60',
        dropTargetStatus === 'valid' &&
          "before:pointer-events-none before:absolute before:inset-0 before:bg-emerald-400/20 before:content-['']",
        dropTargetStatus === 'invalid' &&
          "before:pointer-events-none before:absolute before:inset-0 before:bg-red-500/15 before:content-['']",
      )}
    >
      {isScheduledEvent && dragHandlers ? (
        <button
          aria-label={t('Reorder scheduled construction')}
          className="cursor-grab touch-none active:cursor-grabbing"
          onPointerCancel={dragHandlers.onDragEnd}
          onPointerDown={(event) =>
            dragHandlers.onDragStart(event, buildingEvent.id)
          }
          onPointerMove={dragHandlers.onDragMove}
          onPointerUp={dragHandlers.onDragEnd}
          type="button"
        >
          <LuGripVertical className="text-xl px-1 box-content text-muted-foreground lg:text-2xl" />
        </button>
      ) : (
        <LuConstruction
          aria-label={t('Under construction')}
          className="text-xl px-1 box-content text-muted-foreground lg:text-2xl"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col border-x border-border px-2">
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <b className="truncate">
            {t(`BUILDINGS.${buildingEvent.buildingId}.NAME`)}
          </b>
          <span className="inline-flex items-center text-sm">
            ({buildingEvent.level - 1} <IoIosArrowRoundForward />{' '}
            {buildingEvent.level})
          </span>
        </span>
        <span className="text-sm">
          {isScheduledEvent ? (
            t('In queue')
          ) : (
            <Countdown
              endsAt={buildingEvent.startsAt + buildingEvent.duration}
            />
          )}
        </span>
      </div>

      <button
        aria-label={t('Cancel building construction')}
        onClick={() => onCancel(buildingEvent)}
        type="button"
      >
        <MdCancel className="text-xl text-red-400 lg:text-2xl" />
      </button>
    </div>
  );
};

type CompactConstructionQueueBuildingProps = {
  buildingEvent: BuildingUpgradeQueueEntry;
  isDragging: boolean;
  isSelected: boolean;
  onClick: () => void;
  dragHandlers: ConstructionQueueDragHandlers;
  dropTargetStatus?: DropTargetStatus;
};

const CompactConstructionQueueBuilding = ({
  buildingEvent,
  isDragging,
  isSelected,
  onClick,
  dragHandlers,
  dropTargetStatus,
}: CompactConstructionQueueBuildingProps) => {
  const { t } = useTranslation();
  const isScheduledEvent = buildingEvent.type === 'scheduledBuildingUpgrade';

  return (
    <button
      aria-label={t(`BUILDINGS.${buildingEvent.buildingId}.NAME`)}
      aria-pressed={isSelected}
      className={clsx(
        'relative flex flex-col overflow-hidden rounded-xs border bg-background non-selectable',
        isSelected ? 'border-foreground' : 'border-border',
        isDragging && 'opacity-60',
        dropTargetStatus === 'valid' &&
          "before:pointer-events-none before:absolute before:inset-0 before:bg-emerald-400/20 before:content-['']",
        dropTargetStatus === 'invalid' &&
          "before:pointer-events-none before:absolute before:inset-0 before:bg-red-500/15 before:content-['']",
        isScheduledEvent
          ? 'touch-none cursor-grab active:cursor-grabbing'
          : 'cursor-pointer',
      )}
      onClick={onClick}
      onPointerCancel={isScheduledEvent ? dragHandlers.onDragEnd : undefined}
      onPointerDown={
        isScheduledEvent
          ? (event) => dragHandlers.onDragStart(event, buildingEvent.id)
          : undefined
      }
      onPointerMove={isScheduledEvent ? dragHandlers.onDragMove : undefined}
      onPointerUp={isScheduledEvent ? dragHandlers.onDragEnd : undefined}
      type="button"
    >
      {isScheduledEvent ? (
        <>
          <LuConstruction className="box-content px-2.5 py-2.5 text-2xl text-muted-foreground" />
          <LuGripVertical className="absolute bottom-0 right-0 text-xs text-muted-foreground" />
        </>
      ) : (
        <>
          <LuConstruction className="box-content px-2.5 pb-4 pt-1 text-2xl text-muted-foreground" />
          <Countdown
            className="absolute bottom-0 left-0 w-full border-t border-border bg-background text-center text-2xs leading-none"
            endsAt={buildingEvent.startsAt + buildingEvent.duration}
          />
        </>
      )}
    </button>
  );
};

type ConstructionQueueEventSlotProps = {
  event: BuildingUpgradeQueueEntry;
  isDesktop: boolean;
  draggedId: number | null;
  dropSourceId: number | null;
  selectedEventKey: string | null;
  dragHandlers: ConstructionQueueDragHandlers;
  validDropTargetIds: Set<number>;
  onCancel: (buildingEvent: BuildingUpgradeQueueEntry) => void;
  onSelect: (event: BuildingUpgradeQueueEntry) => void;
};

const ConstructionQueueEventSlot = ({
  event,
  isDesktop,
  draggedId,
  dropSourceId,
  selectedEventKey,
  dragHandlers,
  validDropTargetIds,
  onCancel,
  onSelect,
}: ConstructionQueueEventSlotProps) => {
  const eventKey = getBuildingUpgradeQueueEntryKey(event);
  const isScheduledEvent = event.type === 'scheduledBuildingUpgrade';
  const isDragging = isScheduledEvent && event.id === draggedId;
  const dropTargetStatus =
    isScheduledEvent && dropSourceId !== null && event.id !== dropSourceId
      ? validDropTargetIds.has(event.id)
        ? 'valid'
        : 'invalid'
      : undefined;

  return (
    <li data-scheduled-upgrade-id={isScheduledEvent ? event.id : undefined}>
      {isDesktop ? (
        <ConstructionQueueBuilding
          buildingEvent={event}
          dropTargetStatus={dropTargetStatus}
          dragHandlers={dragHandlers}
          isDragging={isDragging}
          onCancel={onCancel}
        />
      ) : (
        <CompactConstructionQueueBuilding
          buildingEvent={event}
          dropTargetStatus={dropTargetStatus}
          dragHandlers={dragHandlers}
          isDragging={isDragging}
          isSelected={eventKey === selectedEventKey}
          onClick={() => onSelect(event)}
        />
      )}
    </li>
  );
};

const ConstructionQueueContent = () => {
  const { t } = useTranslation();
  const { mutate: cancelConstruction } = useCancelConstruction();
  const { cancelScheduledBuildingUpgrade, reorderScheduledBuildingUpgrades } =
    useScheduledBuildingUpgrades();
  const { buildingUpgradeEvents } = use(CurrentVillageBuildingQueueContext);
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const [isExtended, setIsExtended] = useState<boolean>(false);
  const [selectedEventKey, setSelectedEventKey] = useState<string | null>(null);

  const activeEvents = useMemo(
    () =>
      buildingUpgradeEvents.filter(
        (event) => event.type !== 'scheduledBuildingUpgrade',
      ),
    [buildingUpgradeEvents],
  );

  const scheduledEvents = useMemo(
    () =>
      buildingUpgradeEvents.filter(
        (event): event is ScheduledBuildingUpgrade =>
          event.type === 'scheduledBuildingUpgrade',
      ),
    [buildingUpgradeEvents],
  );

  const {
    dragHandlers,
    draggedId,
    orderedEvents: orderedScheduledEvents,
    validDropTargetIds,
  } = useConstructionQueueDrag(
    scheduledEvents,
    reorderScheduledBuildingUpgrades,
  );

  const cancelBuildingUpgradeQueueEntry = useCallback(
    (buildingEvent: BuildingUpgradeQueueEntry) => {
      if (buildingEvent.type === 'scheduledBuildingUpgrade') {
        cancelScheduledBuildingUpgrade({
          scheduledUpgradeId: buildingEvent.id,
        });
        return;
      }

      cancelConstruction({ eventId: buildingEvent.id });
    },
    [cancelConstruction, cancelScheduledBuildingUpgrade],
  );

  const orderedEvents = [...activeEvents, ...orderedScheduledEvents];
  const selectedEvent = orderedEvents.find(
    (event) => getBuildingUpgradeQueueEntryKey(event) === selectedEventKey,
  );
  const dropSourceId = draggedId;

  const containerRef = useClickOutside<HTMLElement>(() => {
    setIsExtended(false);
    setSelectedEventKey(null);
  });

  const totalSlotsCount = 5;
  const emptySlotsCount = Math.max(0, totalSlotsCount - orderedEvents.length);

  // TODO: We've had reports of a bug where emptySlots is less than 0. We're manually reporting the issue, remove this code block once resolved.
  if (totalSlotsCount - orderedEvents.length < 0) {
    faro.api.pushError(
      new Error(
        'Invalid array length at ConstructionQueue' +
          JSON.stringify({ buildingUpgradeEvents }),
      ),
    );
  }

  const slots = [
    ...orderedEvents.map((event) => ({
      type: 'building' as const,
      event,
    })),
    ...Array.from({ length: emptySlotsCount }, (_, index) => {
      const slotIndex = orderedEvents.length + index;

      return {
        type: 'empty',
        id: `empty-slot-${slotIndex}`,
      } as const;
    }),
  ];

  const visibleSlots = isWiderThanLg || isExtended ? slots : slots.slice(0, 1);

  return (
    <aside
      className="fixed bottom-[calc(max(var(--twsa-safe-area-inset-bottom),2rem)+4.5rem)] left-0 z-10 flex max-w-[calc(100vw-1rem)] flex-col items-start gap-1 transition-all lg:bottom-14"
      ref={containerRef}
    >
      {!isWiderThanLg && selectedEvent && (
        <ConstructionQueueBuilding
          buildingEvent={selectedEvent}
          isDragging={false}
          onCancel={cancelBuildingUpgradeQueueEntry}
        />
      )}
      <ul className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xs rounded-l-none border-border bg-background/80 p-1 shadow-xs transition-all lg:flex-col lg:items-stretch lg:overflow-visible">
        {visibleSlots.map((slot) =>
          slot.type === 'building' ? (
            <ConstructionQueueEventSlot
              dragHandlers={dragHandlers}
              dropSourceId={dropSourceId}
              draggedId={draggedId}
              event={slot.event}
              isDesktop={isWiderThanLg}
              key={getBuildingUpgradeQueueEntryKey(slot.event)}
              onCancel={cancelBuildingUpgradeQueueEntry}
              onSelect={(event) => {
                const key = getBuildingUpgradeQueueEntryKey(event);
                setSelectedEventKey((current) =>
                  current === key ? null : key,
                );
              }}
              selectedEventKey={selectedEventKey}
              validDropTargetIds={validDropTargetIds}
            />
          ) : (
            <li key={slot.id}>
              <ImHammer className={iconClassName} />
            </li>
          ),
        )}

        {!isWiderThanLg && (
          <li className="shrink-0">
            <button
              aria-label={
                isExtended
                  ? t('Close construction queue')
                  : t('Expand construction queue')
              }
              className="box-content rounded-xs border border-border bg-muted py-2.5 text-2xl text-muted-foreground transition-colors"
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
