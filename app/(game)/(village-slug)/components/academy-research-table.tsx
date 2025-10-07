import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useTranslation } from 'react-i18next';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';

export const AcademyResearchTable = () => {
  const { t } = useTranslation();
  const {
    eventsByType: currentVillageUnitResearchEvents,
    hasEvents: hasResearchEventsOngoing,
  } = useEventsByType('unitResearch');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>{t('Unit')}</TableHeaderCell>
          <TableHeaderCell>{t('Remaining time')}</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hasResearchEventsOngoing && (
          <TableRow>
            <TableCell>
              {t(`UNITS.${currentVillageUnitResearchEvents[0].unitId}.NAME`, {
                count: 1,
              })}
            </TableCell>
            <TableCell>
              <Countdown
                endsAt={
                  currentVillageUnitResearchEvents[0].startsAt +
                  currentVillageUnitResearchEvents[0].duration
                }
              />
            </TableCell>
          </TableRow>
        )}
        {!hasResearchEventsOngoing && (
          <TableRow>
            <TableCell colSpan={2}>
              {t('No research is currently taking place')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
