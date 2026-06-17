import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
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

export const MerchantMovementTable = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { eventsByType: resourceTransferEvents, hasEvents } =
    useEventsByType('resourceTransfer');
  const { mapSize } = useServer();

  return (
    <div className="overflow-x-scroll scrollbar-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Direction')}</TableHeaderCell>
            <TableHeaderCell>{t('Origin')}</TableHeaderCell>
            <TableHeaderCell>{t('Destination')}</TableHeaderCell>
            <TableHeaderCell>{t('Resources')}</TableHeaderCell>
            <TableHeaderCell>{t('Merchants')}</TableHeaderCell>
            <TableHeaderCell>{t('Remaining time')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hasEvents &&
            resourceTransferEvents.map((event) => {
              const isReturnMovement = getResourceTotal(event.resources) === 0;
              const didOriginateFromCurrentVillage =
                event.villageId === currentVillage.id;
              const direction = isReturnMovement
                ? t('Returning')
                : event.targetVillageId === currentVillage.id
                  ? t('Incoming')
                  : t('Outgoing');

              return (
                <TableRow key={event.id}>
                  <TableCell>{direction}</TableCell>
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
          {!hasEvents && (
            <TableRow>
              <TableCell colSpan={6}>
                {t(
                  'No merchant movements are currently taking place in this village',
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
