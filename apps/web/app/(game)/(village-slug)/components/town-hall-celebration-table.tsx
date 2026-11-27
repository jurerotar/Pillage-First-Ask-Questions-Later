import { useTranslation } from 'react-i18next';
import { OverflowContainer } from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useActiveCelebration } from 'app/(game)/(village-slug)/hooks/use-active-celebration';
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
  const celebration = useActiveCelebration();

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
          {celebration ? (
            <TableRow>
              <TableCell>
                {celebration.celebrationType === 'small'
                  ? t('Small Celebration')
                  : t('Large Celebration')}
              </TableCell>
              <TableCell>
                <Countdown endsAt={celebration.endsAt} />
              </TableCell>
            </TableRow>
          ) : (
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
