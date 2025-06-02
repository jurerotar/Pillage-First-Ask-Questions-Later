import type { Unit } from 'app/interfaces/models/game/unit';
import { useUnitImprovement } from 'app/(game)/(village-slug)/hooks/use-unit-improvement';
import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import { isUnitImprovementEvent } from 'app/(game)/guards/event-guards';

export const useUnitImprovementLevel = (unitId: Unit['id']) => {
  const { unitImprovements } = useUnitImprovement();
  const { events } = useEvents();


  const unitImprovement = unitImprovements.find((unitImprovement) => unitImprovement.unitId === unitId)!;
  console.log(unitId, unitImprovement);
  const unitLevel = unitImprovement.level;

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
    unitLevel,
    unitVirtualLevel,
    isMaxLevel,
  };
};
