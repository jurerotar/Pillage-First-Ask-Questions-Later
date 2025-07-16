import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { useTranslation } from 'react-i18next';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';

export const SmithyImprovementTable = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const {
    eventsByType: currentVillageUnitImprovementEvents,
    hasEvents: hasImprovementEventsOngoing,
  } = useEventsByType('unitImprovement');

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
        {hasImprovementEventsOngoing && (
          <TableRow>
            <TableCell>
              {assetsT(
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
        {!hasImprovementEventsOngoing && (
          <TableRow>
            <TableCell colSpan={3}>
              {t('No improvements are currently taking place')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
