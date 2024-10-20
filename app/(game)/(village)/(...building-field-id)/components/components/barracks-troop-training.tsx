import { UnitCard } from 'app/(game)/(village)/(...building-field-id)/components/components/components/unit-card';
import { useUnitResearch } from 'app/(game)/hooks/use-unit-research';

export const BarracksTroopTraining = () => {
  const { researchedUnits } = useUnitResearch();

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
