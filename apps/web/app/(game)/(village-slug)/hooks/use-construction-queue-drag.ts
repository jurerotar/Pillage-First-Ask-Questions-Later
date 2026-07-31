import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type ScheduledBuildingUpgrade,
  useScheduledBuildingUpgrades,
} from 'app/(game)/(village-slug)/hooks/use-scheduled-building-upgrades';

export type ConstructionQueueDragHandlers = {
  onDragStart: (
    event: ReactPointerEvent<HTMLButtonElement>,
    upgradeId: number,
  ) => void;
  onDragMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onDragEnd: (event: ReactPointerEvent<HTMLButtonElement>) => void;
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
) => {
  const { reorderScheduledBuildingUpgrades } = useScheduledBuildingUpgrades();
  const [orderedEvents, setOrderedEvents] = useState(scheduledEvents);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const originalOrderRef = useRef<number[]>([]);
  const lastDragTargetIdRef = useRef<number | null>(null);
  const validDropTargetIds = useMemo(
    () => getValidScheduledConstructionDropTargetIds(orderedEvents, draggedId),
    [orderedEvents, draggedId],
  );

  useEffect(() => {
    if (draggedId === null) {
      setOrderedEvents(scheduledEvents);
    }
  }, [draggedId, scheduledEvents]);

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
        setOrderedEvents((current) => {
          const next = moveScheduledUpgrade(current, draggedId, targetId);

          if (!next || !hasValidFieldOrder(next)) {
            return current;
          }

          return next;
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
      const hasChanged = nextIds.some(
        (id, index) => id !== originalOrderRef.current[index],
      );
      if (hasChanged) {
        reorderScheduledBuildingUpgrades({ scheduledUpgradeIds: nextIds });
      }
      lastDragTargetIdRef.current = null;
      setDraggedId(null);
    },
  };

  return { dragHandlers, draggedId, orderedEvents, validDropTargetIds };
};
