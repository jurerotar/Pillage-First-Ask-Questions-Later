import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ScheduledBuildingUpgrade } from 'app/(game)/(village-slug)/hooks/use-scheduled-building-upgrades';

export type ConstructionQueueDragHandlers = {
  onDragStart: (
    event: ReactPointerEvent<HTMLButtonElement>,
    upgradeId: number,
  ) => void;
  onDragMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onDragEnd: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

type ReorderScheduledBuildingUpgrades = (variables: {
  scheduledUpgradeIds: number[];
}) => void;

const dragActivationDistance = 6;

type PendingDrag = {
  upgradeId: number;
  pointerId: number;
  startX: number;
  startY: number;
  originalOrder: number[];
};

const hasValidFieldOrder = (upgrades: ScheduledBuildingUpgrade[]): boolean => {
  const lastLevelByFieldId = new Map<number, number>();

  for (const upgrade of upgrades) {
    const lastLevel = lastLevelByFieldId.get(upgrade.buildingFieldId);
    if (lastLevel !== undefined && upgrade.level <= lastLevel) {
      return false;
    }
    lastLevelByFieldId.set(upgrade.buildingFieldId, upgrade.level);
  }

  return true;
};

const moveScheduledUpgrade = (
  upgrades: ScheduledBuildingUpgrade[],
  draggedId: number,
  targetId: number,
): ScheduledBuildingUpgrade[] | null => {
  const fromIndex = upgrades.findIndex(({ id }) => id === draggedId);
  const toIndex = upgrades.findIndex(({ id }) => id === targetId);

  if (fromIndex === -1 || toIndex === -1) {
    return null;
  }

  const next = [...upgrades];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const getScheduledUpgradeIds = (upgrades: ScheduledBuildingUpgrade[]) => {
  return upgrades.map(({ id }) => id);
};

const areIdsEqual = (left: number[], right: number[]) => {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
};

export const getOrderedScheduledConstructionEvents = (
  scheduledEvents: ScheduledBuildingUpgrade[],
  orderedEventIds: number[],
): ScheduledBuildingUpgrade[] => {
  const scheduledEventById = new Map(
    scheduledEvents.map((event) => [event.id, event]),
  );
  const includedIds = new Set<number>();
  const orderedEvents = orderedEventIds.flatMap((id) => {
    const scheduledEvent = scheduledEventById.get(id);

    if (!scheduledEvent || includedIds.has(id)) {
      return [];
    }

    includedIds.add(id);
    return [scheduledEvent];
  });

  return [
    ...orderedEvents,
    ...scheduledEvents.filter(({ id }) => !includedIds.has(id)),
  ];
};

export const getValidScheduledConstructionDropTargetIds = (
  upgrades: ScheduledBuildingUpgrade[],
  draggedId: number | null,
): Set<number> => {
  if (draggedId === null) {
    return new Set();
  }

  const validDropTargetIds = new Set<number>();

  for (const { id: targetId } of upgrades) {
    if (targetId === draggedId) {
      continue;
    }

    const next = moveScheduledUpgrade(upgrades, draggedId, targetId);

    if (next && hasValidFieldOrder(next)) {
      validDropTargetIds.add(targetId);
    }
  }

  return validDropTargetIds;
};

export const useConstructionQueueDrag = (
  scheduledEvents: ScheduledBuildingUpgrade[],
  reorderScheduledBuildingUpgrades: ReorderScheduledBuildingUpgrades,
) => {
  const scheduledEventIds = useMemo(() => {
    return getScheduledUpgradeIds(scheduledEvents);
  }, [scheduledEvents]);
  const [orderedEventIds, setOrderedEventIds] = useState(scheduledEventIds);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const pendingDragRef = useRef<PendingDrag | null>(null);
  const originalOrderRef = useRef<number[]>([]);
  const lastDragTargetIdRef = useRef<number | null>(null);
  const orderedEvents = useMemo(() => {
    return getOrderedScheduledConstructionEvents(
      scheduledEvents,
      orderedEventIds,
    );
  }, [orderedEventIds, scheduledEvents]);
  const validDropTargetIds = useMemo(
    () => getValidScheduledConstructionDropTargetIds(orderedEvents, draggedId),
    [orderedEvents, draggedId],
  );

  useEffect(() => {
    if (draggedId === null) {
      setOrderedEventIds(scheduledEventIds);
      return;
    }

    if (!scheduledEventIds.includes(draggedId)) {
      setDraggedId(null);
      pendingDragRef.current = null;
      originalOrderRef.current = [];
      lastDragTargetIdRef.current = null;
    }
  }, [draggedId, scheduledEventIds]);

  const dragHandlers: ConstructionQueueDragHandlers = {
    onDragStart: (event, upgradeId) => {
      if (event.button !== 0) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      pendingDragRef.current = {
        upgradeId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originalOrder: orderedEvents.map(({ id }) => id),
      };
      lastDragTargetIdRef.current = null;
    },
    onDragMove: (event) => {
      let activeDraggedId = draggedId;

      if (activeDraggedId === null) {
        const pendingDrag = pendingDragRef.current;

        if (pendingDrag === null || pendingDrag.pointerId !== event.pointerId) {
          return;
        }

        const deltaX = event.clientX - pendingDrag.startX;
        const deltaY = event.clientY - pendingDrag.startY;
        const hasMovedFarEnough =
          Math.hypot(deltaX, deltaY) >= dragActivationDistance;

        if (!hasMovedFarEnough) {
          return;
        }

        activeDraggedId = pendingDrag.upgradeId;
        originalOrderRef.current = pendingDrag.originalOrder;
        setDraggedId(activeDraggedId);
      }

      event.preventDefault();

      const targetId = Number(
        document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>('[data-scheduled-upgrade-id]')?.dataset
          .scheduledUpgradeId ?? Number.NaN,
      );

      if (!Number.isFinite(targetId) || targetId === activeDraggedId) {
        lastDragTargetIdRef.current = null;
        return;
      }

      if (targetId !== lastDragTargetIdRef.current) {
        lastDragTargetIdRef.current = targetId;
        setOrderedEventIds((currentIds) => {
          const currentEvents = getOrderedScheduledConstructionEvents(
            scheduledEvents,
            currentIds,
          );
          const next = moveScheduledUpgrade(
            currentEvents,
            activeDraggedId,
            targetId,
          );

          if (!next || !hasValidFieldOrder(next)) {
            return currentIds;
          }

          return getScheduledUpgradeIds(next);
        });
      }
    },
    onDragEnd: (event) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      pendingDragRef.current = null;

      if (draggedId === null) {
        return;
      }

      const nextIds = orderedEvents.map(({ id }) => id);
      if (!areIdsEqual(nextIds, originalOrderRef.current)) {
        reorderScheduledBuildingUpgrades({ scheduledUpgradeIds: nextIds });
      }
      lastDragTargetIdRef.current = null;
      setDraggedId(null);
    },
  };

  return { dragHandlers, draggedId, orderedEvents, validDropTargetIds };
};
