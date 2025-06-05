import type React from 'react';
import type { PickLiteral } from 'app/utils/typescript';
import type { Building } from 'app/interfaces/models/game/building';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/ui/table';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { useTranslation } from 'react-i18next';
import { unitIdToUnitIconMapper } from 'app/utils/icon';
import { Icon } from 'app/components/icon';

type TroopTrainingTableProps = {
  buildingId: PickLiteral<Building['id'], 'BARRACKS' | 'GREAT_BARRACKS' | 'STABLE' | 'GREAT_STABLE' | 'WORKSHOP' | 'HOSPITAL'>;
};

export const TroopTrainingTable: React.FC<TroopTrainingTableProps> = ({ buildingId }) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { eventsByType } = useEventsByType('troopTraining');

  const relevantTrainingEvents = eventsByType.filter((event) => {
    return event.buildingId === buildingId;
  });

  const hasEvents = relevantTrainingEvents.length > 0;

  const batchedTroopTrainingEventsMap = new Map<string, GameEvent<'troopTraining'>[]>();

  for (const event of relevantTrainingEvents) {
    if (!batchedTroopTrainingEventsMap.has(event.batchId)) {
      batchedTroopTrainingEventsMap.set(event.batchId, []);
    }
    batchedTroopTrainingEventsMap.get(event.batchId)!.push(event);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>{t('Unit')}</TableHeaderCell>
          <TableHeaderCell>{t('Amount')}</TableHeaderCell>
          <TableHeaderCell>{t('Remaining time')}</TableHeaderCell>
          <TableHeaderCell>{t('Next unit ready in')}</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hasEvents &&
          Array.from(batchedTroopTrainingEventsMap).map(([batchId, events]) => {
            const earliestEvent = events[0]!;
            const latestEvent = events.at(-1)!;
            const totalDuration = latestEvent.startsAt + latestEvent.duration;

            return (
              <TableRow key={batchId}>
                <TableCell className="flex items-center gap-2">
                  <Icon
                    type={unitIdToUnitIconMapper(earliestEvent.unitId)}
                    className="size-4"
                  />
                  {assetsT(`UNITS.${earliestEvent.unitId}.NAME`, { count: 1 })}
                </TableCell>
                <TableCell>{events.length}</TableCell>
                <TableCell>
                  <Countdown endsAt={totalDuration} />
                </TableCell>
                <TableCell>
                  <Countdown endsAt={earliestEvent.startsAt + earliestEvent.duration} />
                </TableCell>
              </TableRow>
            );
          })}
        {!hasEvents && (
          <TableRow>
            <TableCell colSpan={4}>{t('No units are currently being trained')}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
