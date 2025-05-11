import { UnitImprovementCard } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-improvement-card';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { units } from 'app/(game)/(village-slug)/assets/units';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import {
  BuildingSection,
  BuildingSectionContent,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/building-layout';

export const SmithyUnitImprovement = () => {
  const { t } = useTranslation();
  const { tribe } = useTribe();
  const { isUnitResearched } = useUnitResearch();

  const upgradableUnits = units.filter(({ category, tribe: unitTribe, id }) => {
    return category !== 'special' && unitTribe === tribe && isUnitResearched(id);
  });

  return (
    <BuildingSection>
      <BuildingSectionContent>
        <Text as="h2">{t('Improve units')}</Text>
        <Text as="p">
          {t(
            'The smithy improves the attack and defence values of troops by 1.5% per upgrade. Only researched units can be improved. Upgrades are limited by current smithy level, up to max level of 20. If you choose to demolish your smithy, you will not lose the upgrades to your troops.',
          )}
        </Text>
      </BuildingSectionContent>
      <BuildingSectionContent>
        {upgradableUnits.map(({ id }) => (
          <UnitImprovementCard
            unitId={id}
            key={id}
          />
        ))}
      </BuildingSectionContent>
    </BuildingSection>
  );
};
