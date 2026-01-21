import type { Unit } from '@pillage-first/types/models/unit';
import { isUnitImprovementEvent } from '@pillage-first/utils/guards/event';
import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import { useUnitImprovement } from 'app/(game)/(village-slug)/hooks/use-unit-improvement';

export const useUnitImprovementLevel = (unitId: Unit['id']) => {
  const { unitImprovements } = useUnitImprovement();
  const { events } = useEvents();

  const unitImprovement = unitImprovements.find(
    (unitImprovement) => unitImprovement.unitId === unitId,
  );
  const unitLevel = unitImprovement?.level ?? 0;

  const unitImprovementEventsForUnit = events.filter((event) => {
    if (!isUnitImprovementEvent(event)) {
      return false;
    }

    return event.unitId === unitId;
  });

  const levelsCurrentlyBeingResearched = unitImprovementEventsForUnit.length;
  const unitVirtualLevel = unitLevel + levelsCurrentlyBeingResearched;

  const isMaxLevel = unitVirtualLevel === 20;

  return {
    canBeImproved: !!unitLevel,
    unitLevel,
    unitVirtualLevel,
    isMaxLevel,
  };
};
