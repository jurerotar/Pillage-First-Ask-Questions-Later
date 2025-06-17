import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { units } from 'app/(game)/(village-slug)/assets/units';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import {
  UnitAttributes,
  UnitCard,
  UnitImprovement,
  UnitOverview,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';

export const SmithyUnitImprovement = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { tribe } = useTribe();
  const { isUnitResearched } = useUnitResearch();
  const {
    eventsByType: currentVillageUnitImprovementEvents,
    hasEvents: hasImprovementEventsOngoing,
  } = useEventsByType('unitImprovement');

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
            {hasImprovementEventsOngoing && (
              <TableRow>
                <TableCell>
                  {assetsT(
                    `UNITS.${currentVillageUnitImprovementEvents[0].unitId}.NAME`,
                    { count: 1 },
                  )}
                </TableCell>
                <TableCell>
                  {currentVillageUnitImprovementEvents[0].level}
                </TableCell>
                <TableCell>
                  <Countdown
                    endsAt={
                      currentVillageUnitImprovementEvents[0].startsAt +
                      currentVillageUnitImprovementEvents[0].duration
                    }
                  />
                </TableCell>
              </TableRow>
            )}
            {!hasImprovementEventsOngoing && (
              <TableRow>
                <TableCell colSpan={3}>
                  {t('No improvements are currently taking place')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionContent>
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
