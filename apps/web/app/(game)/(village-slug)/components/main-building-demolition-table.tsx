import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { IoIosArrowRoundForward } from 'react-icons/io';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCancelDemolition } from 'app/(game)/(village-slug)/hooks/use-cancel-demolition';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider.tsx';
import { Button } from 'app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

export const MainBuildingDemolitionTable = () => {
  const { t } = useTranslation();
  const { buildingDowngradeEvents } = use(CurrentVillageBuildingQueueContext);
  const { mutate: cancelDemolition } = useCancelDemolition();

  const hasDemolitionEvents = buildingDowngradeEvents.length > 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>{t('Building')}</TableHeaderCell>
          <TableHeaderCell>{t('Level')}</TableHeaderCell>
          <TableHeaderCell>{t('Duration')}</TableHeaderCell>
          <TableHeaderCell>{t('Actions')}</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hasDemolitionEvents &&
          buildingDowngradeEvents.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{t(`BUILDINGS.${event.buildingId}.NAME`)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {event.previousLevel}{' '}
                <IoIosArrowRoundForward className="inline" /> {event.level}
              </TableCell>
              <TableCell>
                <Countdown endsAt={event.startsAt + event.duration} />
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => cancelDemolition()}
                  size="fit"
                >
                  {t('Cancel')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        {!hasDemolitionEvents && (
          <TableRow>
            <TableCell colSpan={4}>
              {t('No demolition is currently taking place')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
