import { UnitCard } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-card';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';

export const BarracksTroopTraining = () => {
  const { t } = useTranslation();
  const { getResearchedUnitsByCategory } = useUnitResearch();

  const researchedInfantryUnits = getResearchedUnitsByCategory('infantry');

  return (
    <article className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text as="h2">{t('Train infantry units')}</Text>
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
