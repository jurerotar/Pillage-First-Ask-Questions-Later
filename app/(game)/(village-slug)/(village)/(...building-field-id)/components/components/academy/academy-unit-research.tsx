import { useTranslation } from 'react-i18next';
import { assessUnitResearchReadiness } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/academy/utils/unit-research-requirements';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  UnitCard,
  UnitCost,
  UnitOverview,
  UnitRequirements,
  UnitResearch,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/unit-production-buildings/components/unit-card';
import { AcademyResearchTable } from 'app/(game)/(village-slug)/components/academy-research-table';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { Text } from 'app/components/text';

export const AcademyUnitResearch = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { researchableUnits } = useUnitResearch();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="unit-research" />
        <Text as="h2">{t('Unit research')}</Text>
        <Text>
          {t(
            'To be able to train stronger units, you will need to do research in your academy. The more this building is upgraded, the more you will have access to advanced research.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <AcademyResearchTable />
      </SectionContent>
      <SectionContent>
        <ul className="flex flex-col gap-2">
          {researchableUnits.map(({ id }) => {
            const { canResearch } = assessUnitResearchReadiness(
              id,
              currentVillage,
            );
            return (
              <li key={id}>
                <UnitCard
                  unitId={id}
                  buildingId="BARRACKS"
                >
                  <UnitOverview />
                  <UnitCost />
                  <UnitResearch />
                  {!canResearch && <UnitRequirements />}
                </UnitCard>
              </li>
            );
          })}
        </ul>
      </SectionContent>
    </Section>
  );
};
