import { UnitCard } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-card';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import {
  BuildingSection,
  BuildingSectionContent,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/building-layout';
import { assessUnitResearchReadiness } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/utils/unit-research-requirements';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';

export const AcademyUnitResearch = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { unitResearch } = useUnitResearch();

  return (
    <BuildingSection>
      <BuildingSectionContent>
        <Text as="h2">{t('Unit research')}</Text>
        <Text as="p">
          {t(
            'To be able to train stronger units, you will need to do research in your academy. The more this building is upgraded, the more you will have access to advanced research.',
          )}
        </Text>
      </BuildingSectionContent>
      <BuildingSectionContent>
        <ul className="flex flex-col gap-2">
          {unitResearch.map(({ unitId }) => (
            <li key={unitId}>
              <UnitCard
                unitId={unitId}
                showAttributes
                showUnitCost
                showResearch
                {...(!assessUnitResearchReadiness(unitId, currentVillage).canResearch
                  ? {
                      showRequirements: true,
                    }
                  : {})}
              />
            </li>
          ))}
        </ul>
      </BuildingSectionContent>
    </BuildingSection>
  );
};
