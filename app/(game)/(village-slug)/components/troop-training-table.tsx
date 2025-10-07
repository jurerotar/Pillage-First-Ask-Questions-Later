import type { TroopTrainingBuildingId } from 'app/interfaces/models/game/building';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';

type TroopTrainingTableProps = {
  buildingId: TroopTrainingBuildingId;
};

export const TroopTrainingTable = ({ buildingId }: TroopTrainingTableProps) => {
  const { t } = useTranslation();
  const { eventsByType } = useEventsByType('troopTraining');

  const relevantTrainingEvents = eventsByType.filter((event) => {
    return event.buildingId === buildingId;
  });

  const batchedTroopTrainingEventsMap = new Map<
    string,
    GameEvent<'troopTraining'>[]
  >();

  for (const event of relevantTrainingEvents) {
    if (!batchedTroopTrainingEventsMap.has(event.batchId)) {
      batchedTroopTrainingEventsMap.set(event.batchId, []);
    }
    batchedTroopTrainingEventsMap.get(event.batchId)!.push(event);
  }

  const batchedArray = Array.from(batchedTroopTrainingEventsMap.entries());
  const hasEvents = batchedArray.length > 0;
  const maxVisible = 3;

  // Count all remaining units by unitId after the first 3 batches
  const remainingBatches = batchedArray.slice(maxVisible);
  const unitCounts: Record<string, number> = {};
  for (const [, events] of remainingBatches) {
    for (const event of events) {
      unitCounts[event.unitId] = (unitCounts[event.unitId] || 0) + 1;
    }
  }

  const remainingUnitSummary = Object.entries(unitCounts)
    .map(
      ([unitId, count]) => `${count} ${t(`UNITS.${unitId}.NAME`, { count })}`,
    )
    .join(', ');

  return (
    <div className="scrollbar-hidden overflow-x-scroll">
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
          {hasEvents && (
            <>
              {batchedArray.slice(0, maxVisible).map(([batchId, events]) => {
                const earliestEvent = events[0]!;
                const latestEvent = events.at(-1)!;
                const totalDuration =
                  latestEvent.startsAt + latestEvent.duration;

                return (
                  <TableRow key={batchId}>
                    <TableCell>
                      {/*<Icon*/}
                      {/*  type={unitIdToUnitIconMapper(earliestEvent.unitId)}*/}
                      {/*  className="size-4 inline-flex"*/}
                      {/*/>*/}
                      {t(`UNITS.${earliestEvent.unitId}.NAME`, {
                        count: 1,
                      })}
                    </TableCell>
                    <TableCell>{events.length}</TableCell>
                    <TableCell>
                      <Countdown endsAt={totalDuration} />
                    </TableCell>
                    <TableCell>
                      <Countdown
                        endsAt={earliestEvent.startsAt + earliestEvent.duration}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {batchedArray.length > maxVisible && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Text>
                      {t('... with {{units}} awaiting training', {
                        units: remainingUnitSummary,
                      })}
                    </Text>
                  </TableCell>
                </TableRow>
              )}
            </>
          )}
          {!hasEvents && (
            <TableRow>
              <TableCell colSpan={4}>
                <Text>{t('No units are currently being trained')}</Text>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
