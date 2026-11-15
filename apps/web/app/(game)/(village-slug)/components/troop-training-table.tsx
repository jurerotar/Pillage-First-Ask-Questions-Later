import { Trans, useTranslation } from 'react-i18next';
import type { TroopTrainingBuildingId } from '@pillage-first/types/models/building';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Unit } from '@pillage-first/types/models/unit';
import { OverflowContainer } from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { useIntl } from 'app/hooks/use-intl';
import { formatTime } from 'app/utils/time';

type TroopTrainingTableProps = {
  buildingId: TroopTrainingBuildingId;
};

export const TroopTrainingTable = ({ buildingId }: TroopTrainingTableProps) => {
  const { t } = useTranslation();
  const intl = useIntl();
  const { eventsByType } = useEventsByType('troopTraining');

  const relevantTrainingEvents = eventsByType.filter((event) => {
    return event.buildingId === buildingId;
  });

  const batchedTroopTrainingEventsMap = new Map<
    string,
    GameEvent<'troopTraining'>[]
  >();

  let totalQueueDuration = 0;

  for (const event of relevantTrainingEvents) {
    totalQueueDuration += event.duration;

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
  const unitCounts = new Map<Unit['id'], number>();

  for (const [, events] of remainingBatches) {
    for (const event of events) {
      unitCounts.set(event.unitId, (unitCounts.get(event.unitId) ?? 0) + 1);
    }
  }

  const remainingUnitItems = new Map(
    Array.from(unitCounts, ([unitId, count]) => [
      String(unitId),
      <span
        key={unitId}
        className="inline-flex items-center gap-1 align-baseline"
      >
        {count}
        <Icon
          type={unitIdToUnitIconMapper(unitId)}
          className="size-4"
          aria-label={t(`UNITS.${unitId}.NAME`, { count })}
        />
      </span>,
    ]),
  );

  const remainingUnitSummary = (
    <span>
      {intl.list
        .formatToParts(Array.from(remainingUnitItems.keys()))
        .map(({ type, value }) =>
          type === 'element' ? remainingUnitItems.get(value) : value,
        )}
    </span>
  );

  return (
    <OverflowContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Unit')}</TableHeaderCell>
            <TableHeaderCell>{t('Amount')}</TableHeaderCell>
            <TableHeaderCell>{t('Time left')}</TableHeaderCell>
            <TableHeaderCell>{t('Next in')}</TableHeaderCell>
            <TableHeaderCell>{t('Total')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hasEvents && (
            <>
              {batchedArray.slice(0, maxVisible).map(([batchId, events]) => {
                const [earliestEvent] = events;
                const latestEvent = events.at(-1)!;
                const endsAt = latestEvent.startsAt + latestEvent.duration;
                let totalDuration = 0;

                for (const event of events) {
                  totalDuration += event.duration;
                }

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
                      <Countdown endsAt={endsAt} />
                    </TableCell>
                    <TableCell>
                      <Countdown
                        endsAt={earliestEvent.startsAt + earliestEvent.duration}
                      />
                    </TableCell>
                    <TableCell>{formatTime(totalDuration)}</TableCell>
                  </TableRow>
                );
              })}
              {batchedArray.length > maxVisible && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Text>
                      <Trans
                        i18nKey="... with <units/> awaiting training"
                        components={{ units: remainingUnitSummary }}
                      />
                    </Text>
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="font-medium">
                <TableCell colSpan={4}>{t('Total duration')}</TableCell>
                <TableCell>{formatTime(totalQueueDuration)}</TableCell>
              </TableRow>
            </>
          )}
          {!hasEvents && (
            <TableRow>
              <TableCell colSpan={5}>
                <Text>{t('No units are currently being trained')}</Text>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </OverflowContainer>
  );
};
