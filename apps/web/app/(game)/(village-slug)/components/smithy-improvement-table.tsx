import { useTranslation } from 'react-i18next';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

export const SmithyImprovementTable = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { eventsByType: unitImprovementEvents } =
    useEventsByType('unitImprovement');

  const currentVillageUnitImprovementEvents = unitImprovementEvents.filter(
    ({ villageId }) => currentVillage.id === villageId,
  );
  const hasOngoingCurrentVillageImprovementEvents =
    currentVillageUnitImprovementEvents.length > 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>{t('Unit')}</TableHeaderCell>
          <TableHeaderCell>{t('Level')}</TableHeaderCell>
          <TableHeaderCell>{t('Remaining time')}</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hasOngoingCurrentVillageImprovementEvents && (
          <TableRow>
            <TableCell>
              {t(
                `UNITS.${currentVillageUnitImprovementEvents[0].unitId}.NAME`,
                {
                  count: 1,
                },
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
        {!hasOngoingCurrentVillageImprovementEvents && (
          <TableRow>
            <TableCell colSpan={3}>
              {t('No improvements are currently taking place in this village')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
