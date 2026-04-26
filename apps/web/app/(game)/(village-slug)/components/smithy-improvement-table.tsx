import { useTranslation } from 'react-i18next';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { Button } from 'app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

type SmithyImprovementTableProps = {
  onImprovementCancel: (improvementEvent: number) => void;
};

export const SmithyImprovementTable = ({
  onImprovementCancel,
}: SmithyImprovementTableProps) => {
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
          <TableHeaderCell>{t('Actions')}</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hasOngoingCurrentVillageImprovementEvents &&
          currentVillageUnitImprovementEvents.map((improvementEvent) => {
            return (
              <TableRow key={improvementEvent.id}>
                <TableCell>
                  {t(`UNITS.${improvementEvent.unitId}.NAME`, {
                    count: 1,
                  })}
                </TableCell>
                <TableCell>{improvementEvent.level}</TableCell>
                <TableCell>
                  <Countdown
                    endsAt={
                      improvementEvent.startsAt + improvementEvent.duration
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => onImprovementCancel(improvementEvent.id)}
                    size="fit"
                  >
                    {t('Cancel')}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
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
