import { UnitCard } from 'app/(game)/(village)/(...building-field-id)/components/components/components/unit-card';
import { useCreateEvent } from 'app/(game)/hooks/use-create-event';
import { useUnitResearch } from 'app/(game)/hooks/use-unit-research';
import { GameEventType } from 'app/interfaces/models/events/game-event';

export const BarracksTroopTraining = () => {
  const { researchedUnits } = useUnitResearch();

  console.log(researchedUnits);

  const { createBulkEvent: createBulkBarracksTrainingEvent } = useCreateEvent(GameEventType.TROOP_TRAINING);

  return (
    <article>
      {researchedUnits.map(({ unitId }) => (
        <UnitCard
          key={unitId}
          unitId={unitId}
          showImprovementLevel
          showAttributes
          showUnitCost
        />
      ))}
    </article>
  );
};
