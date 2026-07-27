import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
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
): ScheduledBuildingUpgrade[] => {
  const fromIndex = upgrades.findIndex(({ id }) => id === draggedId);
  const toIndex = upgrades.findIndex(({ id }) => id === targetId);

  if (fromIndex === -1 || toIndex === -1) {
    return upgrades;
  }

  const next = [...upgrades];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return hasValidFieldOrder(next) ? next : upgrades;
};

export const useConstructionQueueDrag = (
  scheduledEvents: ScheduledBuildingUpgrade[],
) => {
  const { reorderScheduledBuildingUpgrades } = useScheduledBuildingUpgrades();
  const [orderedEvents, setOrderedEvents] = useState(scheduledEvents);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const originalOrderRef = useRef<number[]>([]);

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

      if (Number.isFinite(targetId) && targetId !== draggedId) {
        setOrderedEvents((current) =>
          moveScheduledUpgrade(current, draggedId, targetId),
        );
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
      setDraggedId(null);
    },
  };

  return { dragHandlers, draggedId, orderedEvents };
};
