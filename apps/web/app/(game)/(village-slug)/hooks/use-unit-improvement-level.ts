import type { Unit } from '@pillage-first/types/models/unit';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type.ts';
import { useUnitImprovement } from 'app/(game)/(village-slug)/hooks/use-unit-improvement';

export const useUnitImprovementLevel = (unitId: Unit['id']) => {
  const { unitImprovements } = useUnitImprovement();
  const { eventsByType: unitImprovementEvents } =
    useEventsByType('unitImprovement');

  const unitImprovement = unitImprovements.find(
    (unitImprovement) => unitImprovement.unitId === unitId,
  );
  const unitLevel = unitImprovement?.level ?? 0;

  const unitImprovementEventsForUnit = unitImprovementEvents.filter((event) => {
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
