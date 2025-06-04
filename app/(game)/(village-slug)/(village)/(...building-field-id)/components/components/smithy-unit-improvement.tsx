import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { units } from 'app/(game)/(village-slug)/assets/units';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Section, SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import {
  UnitAttributes,
  UnitCard,
  UnitImprovement,
  UnitLevel,
  UnitOverview,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-card';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/ui/table';
import { useCurrentVillageUnitImprovementEvent } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/hooks/use-current-village-unit-improvement-event';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';

export const SmithyUnitImprovement = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { tribe } = useTribe();
  const { isUnitResearched } = useUnitResearch();
  const { currentVillageUnitImprovementEvent } = useCurrentVillageUnitImprovementEvent();

  const upgradableUnits = units.filter(({ category, tribe: unitTribe, id }) => {
    return category !== 'special' && unitTribe === tribe && isUnitResearched(id);
  });

  const hasImprovementEventOngoing = !!currentVillageUnitImprovementEvent;

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Improve units')}</Text>
        <Text as="p">
          {t(
            'The smithy improves the attack and defence values of troops by 1.5% per upgrade. Only researched units can be improved. Upgrades are limited by current smithy level, up to max level of 20. If you choose to demolish your smithy, you will not lose the upgrades to your troops. Each smithy can only work on 1 upgrade at the time, but multiple smithies may work on multiple level upgrades for the same unit at the same time.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Unit')}</TableHeaderCell>
              <TableHeaderCell>{t('Level')}</TableHeaderCell>
              <TableHeaderCell>{t('Remaining time')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasImprovementEventOngoing && (
              <TableRow>
                <TableCell>{assetsT(`UNITS.${currentVillageUnitImprovementEvent.unitId}.NAME`, { count: 1 })}</TableCell>
                <TableCell>{currentVillageUnitImprovementEvent.level}</TableCell>
                <TableCell>
                  <Countdown endsAt={currentVillageUnitImprovementEvent.startsAt + currentVillageUnitImprovementEvent.duration} />
                </TableCell>
              </TableRow>
            )}
            {!hasImprovementEventOngoing && (
              <TableRow>
                <TableCell colSpan={3}>{t('No improvements are currently taking place')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionContent>
      <SectionContent>
        {upgradableUnits.map(({ id }) => (
          <UnitCard
            unitId={id}
            key={id}
          >
            <UnitOverview />
            <UnitAttributes />
            <UnitLevel />
            <UnitImprovement />
          </UnitCard>
        ))}
      </SectionContent>
    </Section>
  );
};
