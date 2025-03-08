import { UnitCard } from 'app/(game)/(village)/(...building-field-id)/components/components/components/unit-card';
import { useUnitResearch } from 'app/(game)/hooks/use-unit-research';
import { Text } from 'app/components/text';
import { Trans } from '@lingui/react/macro';

export const BarracksTroopTraining = () => {
  const { researchedInfantryUnits } = useUnitResearch();

  return (
    <article className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text as="h2">
          <Trans>Train infantry units</Trans>
        </Text>

        {researchedInfantryUnits.map(({ unitId }) => (
          <UnitCard
            key={unitId}
            unitId={unitId}
            showImprovementLevel
            showAttributes
            showUnitCost
          />
        ))}
      </div>
    </article>
  );
};
