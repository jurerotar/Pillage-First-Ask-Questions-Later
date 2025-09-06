import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  UnitAttributes,
  UnitCard,
  UnitImprovement,
  UnitOverview,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-card';
import { units } from 'app/assets/units';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';

export const SmithyUnitImprovement = () => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { isUnitResearched } = useUnitResearch();

  const upgradableUnits = units.filter(({ category, tribe: unitTribe, id }) => {
    return (
      category !== 'special' && unitTribe === tribe && isUnitResearched(id)
    );
  });

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="unit-improvement" />
        <Text as="h2">{t('Improve units')}</Text>
        <Text>
          {t(
            'The smithy improves the attack and defence values of troops by 1.5% per upgrade. Only researched units can be improved. Upgrades are limited by current smithy level, up to max level of 20. If you choose to demolish your smithy, you will not lose the upgrades to your troops. Each smithy can only work on 1 upgrade at the time, but multiple smithies may work on multiple level upgrades for the same unit at the same time.',
          )}
        </Text>
      </SectionContent>
      <SectionContent />
      <SectionContent>
        {upgradableUnits.map(({ id }) => (
          <UnitCard
            buildingId="BARRACKS"
            unitId={id}
            key={id}
          >
            <UnitOverview />
            <UnitAttributes />
            <UnitImprovement />
          </UnitCard>
        ))}
      </SectionContent>
    </Section>
  );
};
