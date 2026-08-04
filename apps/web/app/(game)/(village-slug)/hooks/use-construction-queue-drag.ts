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
      originalOrderRef.current = [];
      lastDragTargetIdRef.current = null;
    }
  }, [draggedId, scheduledEventIds]);

  const dragHandlers: ConstructionQueueDragHandlers = {
    onDragStart: (event, upgradeId) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      originalOrderRef.current = orderedEvents.map(({ id }) => id);
      lastDragTargetIdRef.current = null;
      setDraggedId(upgradeId);
    },
    onDragMove: (event) => {
      if (draggedId === null) {
        return;
      }

      const targetId = Number(
        document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>('[data-scheduled-upgrade-id]')?.dataset
          .scheduledUpgradeId ?? Number.NaN,
      );

      if (
        Number.isFinite(targetId) &&
        targetId !== draggedId &&
        targetId !== lastDragTargetIdRef.current
      ) {
        lastDragTargetIdRef.current = targetId;
        setOrderedEventIds((currentIds) => {
          const currentEvents = getOrderedScheduledConstructionEvents(
            scheduledEvents,
            currentIds,
          );
          const next = moveScheduledUpgrade(currentEvents, draggedId, targetId);

          if (!next || !hasValidFieldOrder(next)) {
            return currentIds;
          }

          return getScheduledUpgradeIds(next);
        });
      }
    },
    onDragEnd: (event) => {
      if (draggedId === null) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
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
