import { UnitCard } from 'app/(game)/(village)/(...building-field-id)/components/components/components/unit-card';
import { assessUnitResearchReadiness } from 'app/(game)/(village)/(...building-field-id)/components/components/utils/unit-research-requirements';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useUnitResearch } from 'app/(game)/hooks/use-unit-research';
import { partition } from 'app/utils/common';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';

export const AcademyUnitResearch = () => {
  const { t } = useTranslation();
  const { currentVillage, currentVillageId } = useCurrentVillage();
  const { unitResearch } = useUnitResearch();

  const [researchedUnits, unresearchedUnits] = partition(unitResearch, ({ researchedIn }) => researchedIn.includes(currentVillageId));

  const assessedUnits = unresearchedUnits.map(({ unitId }) => assessUnitResearchReadiness(unitId, currentVillage));

  const [researchReadyUnits, unitsNotReadyForResearch] = partition(assessedUnits, ({ canResearch }) => canResearch);

  return (
    <section className="flex flex-col gap-2">
      <Text as="h2">{t('APP.GAME.BUILDING_FIELD.BUILDING_DETAILS.TAB_PANELS.ACADEMY.UNIT_RESEARCH.TITLE')}</Text>
      {researchedUnits.length > 0 && (
        <ul className="flex flex-col gap-2">
          {researchedUnits.map(({ unitId }) => (
            <li key={unitId}>
              <UnitCard
                unitId={unitId}
                showResearch
                showAttributes
                showUnitCost
              />
            </li>
          ))}
        </ul>
      )}

      {researchReadyUnits.length > 0 && (
        <ul className="flex flex-col gap-2">
          {researchReadyUnits.map(({ unitId }) => (
            <li key={unitId}>
              <UnitCard
                unitId={unitId}
                showRequirements
                showResearch
                showUnitCost
              />
            </li>
          ))}
        </ul>
      )}

      {unitsNotReadyForResearch.length > 0 && (
        <ul className="flex flex-col gap-2">
          {unitsNotReadyForResearch.map(({ unitId }) => (
            <li key={unitId}>
              <UnitCard
                unitId={unitId}
                showRequirements
                showResearch
                showUnitCost
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
