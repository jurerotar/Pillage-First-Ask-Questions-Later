import {
  UnitAttributes,
  UnitCard,
  UnitCost,
  UnitOverview,
  UnitRequirements,
  UnitResearch,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-card';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Section, SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { assessUnitResearchReadiness } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/utils/unit-research-requirements';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/ui/table';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillageUnitResearchEvent } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/hooks/use-current-village-unit-research-event';

export const AcademyUnitResearch = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { researchableUnits } = useUnitResearch();
  const { currentVillageUnitResearchEvent } = useCurrentVillageUnitResearchEvent();

  const hasResearchEventOngoing = !!currentVillageUnitResearchEvent;

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Unit research')}</Text>
        <Text as="p">
          {t(
            'To be able to train stronger units, you will need to do research in your academy. The more this building is upgraded, the more you will have access to advanced research.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Unit')}</TableHeaderCell>
              <TableHeaderCell>{t('Remaining time')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasResearchEventOngoing && (
              <TableRow>
                <TableCell>{assetsT(`UNITS.${currentVillageUnitResearchEvent.unitId}.NAME`, { count: 1 })}</TableCell>
                <TableCell>
                  <Countdown endsAt={currentVillageUnitResearchEvent.startsAt + currentVillageUnitResearchEvent.duration} />
                </TableCell>
              </TableRow>
            )}
            {!hasResearchEventOngoing && (
              <TableRow>
                <TableCell colSpan={2}>{t('No research is currently taking place')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionContent>
      <SectionContent>
        <ul className="flex flex-col gap-2">
          {researchableUnits.map(({ id }) => {
            const { canResearch } = assessUnitResearchReadiness(id, currentVillage);
            return (
              <li key={id}>
                <UnitCard unitId={id}>
                  <UnitOverview />
                  <UnitAttributes />
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
