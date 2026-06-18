import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resources as ResourcesType } from '@pillage-first/types/models/resource';
import { formatNumber } from '@pillage-first/utils/format';
import { tileIdToCoordinates } from '@pillage-first/utils/map';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const getResourceTotal = (resources: ResourcesType) => {
  return resources.wood + resources.clay + resources.iron + resources.wheat;
};

const getResourceList = (resources: ResourcesType) => {
  return [resources.wood, resources.clay, resources.iron, resources.wheat];
};

const TileMapLink = ({
  tileId,
  mapSize,
}: {
  tileId: number;
  mapSize: number;
}) => {
  const { x, y } = tileIdToCoordinates(tileId, mapSize);

  return (
    <Text variant="link">
      <Link to={`../map?x=${x}&y=${y}`}>
        ({x} | {y})
      </Link>
    </Text>
  );
};

type MerchantMovementEvent = GameEvent<'resourceTransfer'>;

const MerchantMovementTableSection = ({
  title,
  events,
  emptyMessage,
  currentVillageId,
  mapSize,
}: {
  title: string;
  events: MerchantMovementEvent[];
  emptyMessage: string;
  currentVillageId: number;
  mapSize: number;
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Text
        as="h3"
        className="font-medium"
      >
        {title}
      </Text>
      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Origin')}</TableHeaderCell>
              <TableHeaderCell>{t('Destination')}</TableHeaderCell>
              <TableHeaderCell>{t('Resources')}</TableHeaderCell>
              <TableHeaderCell>{t('Merchants')}</TableHeaderCell>
              <TableHeaderCell>{t('Remaining time')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const didOriginateFromCurrentVillage =
                event.villageId === currentVillageId;

              return (
                <TableRow key={event.id}>
                  <TableCell>
                    <TileMapLink
                      tileId={event.originTileId}
                      mapSize={mapSize}
                    />
                  </TableCell>
                  <TableCell>
                    <TileMapLink
                      tileId={event.targetTileId}
                      mapSize={mapSize}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-2">
                      <Resources resources={getResourceList(event.resources)} />
                    </span>
                  </TableCell>
                  <TableCell>
                    {didOriginateFromCurrentVillage
                      ? formatNumber(event.merchantAmount)
                      : '/'}
                  </TableCell>
                  <TableCell>
                    <Countdown endsAt={event.resolvesAt} />
                  </TableCell>
                </TableRow>
              );
            })}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>{emptyMessage}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const MerchantMovementTable = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { eventsByType: resourceTransferEvents } =
    useEventsByType('resourceTransfer');
  const { mapSize } = useServer();

  const incomingMerchantEvents = resourceTransferEvents.filter((event) => {
    return (
      event.targetVillageId === currentVillage.id &&
      getResourceTotal(event.resources) > 0
    );
  });
  const outgoingMerchantEvents = resourceTransferEvents.filter((event) => {
    return event.villageId === currentVillage.id;
  });

  return (
    <div className="space-y-4">
      <MerchantMovementTableSection
        title={t('Incoming merchants')}
        events={incomingMerchantEvents}
        emptyMessage={t('No incoming merchants are currently on the way')}
        currentVillageId={currentVillage.id}
        mapSize={mapSize}
      />
      <MerchantMovementTableSection
        title={t('Outgoing merchants')}
        events={outgoingMerchantEvents}
        emptyMessage={t('No outgoing merchants are currently on the way')}
        currentVillageId={currentVillage.id}
        mapSize={mapSize}
      />
    </div>
  );
};
