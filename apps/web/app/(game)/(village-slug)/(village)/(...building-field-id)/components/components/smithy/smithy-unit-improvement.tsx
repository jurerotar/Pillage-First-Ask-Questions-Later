import { useTranslation } from 'react-i18next';
import { units } from '@pillage-first/game-assets/units';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  UnitAttributes,
  UnitCard,
  UnitImprovement,
  UnitOverview,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/unit-production-buildings/components/unit-card';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { SmithyImprovementTable } from 'app/(game)/(village-slug)/components/smithy-improvement-table';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';

export const SmithyUnitImprovement = () => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { isUnitResearched } = useUnitResearch();

  const upgradableUnits = units.filter(({ category, tribe: unitTribe, id }) => {
    return (
      category !== 'administration' &&
      unitTribe === tribe &&
      isUnitResearched(id)
    );
  });

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="unit-improvement" />
        <InformationPopover ariaLabel={t('Improve units')}>
          <Text>
            {t(
              'The smithy improves the attack and defence values of troops by 1.5% per upgrade. Only researched units can be improved. Upgrades are limited by current smithy level, up to max level of 20. If you choose to demolish your smithy, you will not lose the upgrades to your troops. Each smithy can only work on 1 upgrade at the time, but multiple smithies may work on multiple level upgrades for the same unit at the same time.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Improve units')}</Text>
      </SectionContent>
      <SectionContent>
        <SmithyImprovementTable />
      </SectionContent>
      <SectionContent>
        {upgradableUnits.map(({ id }) => (
          <div
            key={id}
            className="p-2 border border-border"
          >
            <UnitCard unitId={id}>
              <UnitOverview />
              <UnitAttributes />
              <UnitImprovement />
            </UnitCard>
          </div>
        ))}
      </SectionContent>
    </Section>
  );
};
