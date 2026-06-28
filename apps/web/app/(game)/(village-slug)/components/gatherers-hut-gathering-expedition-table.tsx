import { useTranslation } from 'react-i18next';
import { calculateGatherersHutGatheringResources } from '@pillage-first/game-assets/utils/gatherers-hut';
import { formatNumber } from '@pillage-first/utils/format';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

export const GatherersHutGatheringExpeditionTable = () => {
  const { t } = useTranslation();
  const { eventsByType: gatheringExpeditionEvents } = useEventsByType(
    'gatherersHutGatheringTrip',
  );

  return (
    <div className="scrollbar-hidden overflow-x-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Party')}</TableHeaderCell>
            <TableHeaderCell>{t('Expected resources')}</TableHeaderCell>
            <TableHeaderCell>{t('Returns in')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gatheringExpeditionEvents.map((event) => {
            let troopAmount = 0;

            for (const troop of event.troops) {
              troopAmount += troop.amount;
            }

            return (
              <TableRow key={event.id}>
                <TableCell>{formatNumber(troopAmount)}</TableCell>
                <TableCell>
                  <span className="inline-flex gap-2">
                    <Resources
                      resources={calculateGatherersHutGatheringResources(
                        troopAmount,
                      )}
                    />
                  </span>
                </TableCell>
                <TableCell>
                  <Countdown endsAt={event.resolvesAt} />
                </TableCell>
              </TableRow>
            );
          })}
          {gatheringExpeditionEvents.length === 0 && (
            <TableRow>
              <TableCell colSpan={3}>
                {t('No gathering expeditions are currently active')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
