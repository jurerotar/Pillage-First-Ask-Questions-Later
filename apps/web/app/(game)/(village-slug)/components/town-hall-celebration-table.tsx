import { useTranslation } from 'react-i18next';
import { OverflowContainer } from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

export const TownHallCelebrationTable = () => {
  const { t } = useTranslation();
  const { eventsByType: celebrationEvents } = useEventsByType(
    'culturePointsCelebration',
  );

  return (
    <OverflowContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Celebration')}</TableHeaderCell>
            <TableHeaderCell>{t('Remaining time')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {celebrationEvents.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                {event.celebrationType === 'small'
                  ? t('Small Celebration')
                  : t('Large Celebration')}
              </TableCell>
              <TableCell>
                <Countdown endsAt={event.resolvesAt} />
              </TableCell>
            </TableRow>
          ))}
          {celebrationEvents.length === 0 && (
            <TableRow>
              <TableCell colSpan={2}>
                {t('No celebrations are currently active')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </OverflowContainer>
  );
};
