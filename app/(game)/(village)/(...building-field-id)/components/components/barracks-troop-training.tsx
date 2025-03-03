import { UnitCard } from 'app/(game)/(village)/(...building-field-id)/components/components/components/unit-card';
import { useUnitResearch } from 'app/(game)/hooks/use-unit-research';
import { Text } from 'app/components/text';

export const BarracksTroopTraining = () => {
  const { researchedInfantryUnits } = useUnitResearch();

  return (
    <article className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text as="h2">{t('APP.GAME.BUILDING_FIELD.BUILDING_DETAILS.TAB_PANELS.BARRACKS.TROOP_TRAINING.TITLE')}</Text>

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
