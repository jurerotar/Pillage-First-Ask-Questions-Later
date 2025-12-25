import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useTilePlayer } from 'app/(game)/(village-slug)/(map)/components/hooks/use-tile-player';
import { useTileTroops } from 'app/(game)/(village-slug)/(map)/components/hooks/use-tile-troops';
import { useTileWorldItem } from 'app/(game)/(village-slug)/(map)/components/hooks/use-tile-world-item';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useVillages } from 'app/(game)/(village-slug)/hooks/use-villages';
import {
  isOasisTile,
  isOccupiableOasisTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
} from 'app/(game)/(village-slug)/utils/guards/map-guards';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Skeleton } from 'app/components/ui/skeleton';
import type {
  OasisResourceBonus,
  OasisTile,
  OccupiableTile,
  OccupiedOccupiableTile,
  Tile,
} from 'app/interfaces/models/game/tile';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import {
  calculateDistanceBetweenPoints,
  formatNumber,
  roundToNDecimalPoints,
} from 'app/utils/common';
import { parseRFCFromTile } from 'app/utils/map';

type TileTooltipProps = {
  tile: Tile;
};

const TileTooltipLocation = ({ tile }: TileTooltipProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const distance = roundToNDecimalPoints(
    calculateDistanceBetweenPoints(
      currentVillage.coordinates,
      tile.coordinates,
    ),
  );

  const { x, y } = tile.coordinates;

  return (
    <span className="text-xs text-gray-300">
      ({x}|{y}) - {t('{{count}} fields', { count: distance })}
    </span>
  );
};

const TileTooltipPlayerInfo = ({ tile }: TileTooltipProps) => {
  const { t } = useTranslation();
  const { player, reputation, population } = useTilePlayer(tile.id);

  const { name, tribe } = player;
  const { faction, reputationLevel } = reputation;

  return (
    <>
      <span>
        {t('Player')} - {name}
      </span>
      {faction !== 'player' && (
        <>
          <span>
            {t('Faction')} - {t(`FACTIONS.${faction.toUpperCase()}`)}
          </span>
          <span>
            {t('Reputation')} -{' '}
            {t(`REPUTATIONS.${reputationLevel.toUpperCase()}`)}
          </span>
        </>
      )}
      <span>
        {t('Tribe')} - {t(`TRIBES.${tribe.toUpperCase()}`)}
      </span>
      <span>
        {t('Population')} - {population}
      </span>
    </>
  );
};

type TileTooltipWorldItemProps = {
  item: WorldItem;
};

const TileTooltipWorldItem = ({ item }: TileTooltipWorldItemProps) => {
  const { t } = useTranslation();

  if (item.type === 'resource') {
    return (
      <span>
        {formatNumber(item.amount)}x {t('resources')}
      </span>
    );
  }

  return (
    <span>
      {formatNumber(item.amount)}x {t(`ITEMS.${item.name}.NAME`)}
    </span>
  );
};

type TileTooltipAnimalsProps = {
  tile: OasisTile;
};

const TileTooltipAnimals = ({ tile }: TileTooltipAnimalsProps) => {
  const { troops } = useTileTroops(tile.id);

  return (
    <>
      {troops.map(({ unitId, amount }) => (
        <span
          key={unitId}
          className="flex gap-1"
        >
          <Icon type={unitIdToUnitIconMapper(unitId)} />
          {amount}
        </span>
      ))}
    </>
  );
};

type TileTooltipResourcesProps = {
  tile: OccupiableTile;
};

const TileTooltipResources = ({ tile }: TileTooltipResourcesProps) => {
  const resources = parseRFCFromTile(tile.RFC);
  return (
    <Resources
      iconClassName="size-4"
      resources={resources}
    />
  );
};

type OasisTileTooltipProps = {
  tile: OasisTile;
};

const OasisTileTooltip = ({ tile }: OasisTileTooltipProps) => {
  const { t } = useTranslation();

  const isOccupiable = isOccupiableOasisTile(tile);
  const isOccupied = isOccupiedOasisTile(tile);
  const title = (() => {
    if (!isOccupiable) {
      return t('Wilderness');
    }
    return isOccupied ? t('Occupied oasis') : t('Unoccupied oasis');
  })();

  return (
    <>
      <span className="font-semibold">{title}</span>
      <TileTooltipLocation tile={tile} />
      {tile.ORB.map(({ resource, bonus }: OasisResourceBonus) => (
        <span
          key={resource}
          className="flex gap-1"
        >
          <Icon
            className="size-4"
            type={resource}
          />
          {bonus}
        </span>
      ))}
      {isOccupied && <TileTooltipPlayerInfo tile={tile} />}
      {!isOccupied && <TileTooltipAnimals tile={tile} />}
    </>
  );
};

type OccupiableTileTooltipProps = {
  tile: OccupiableTile;
};

const OccupiableTileTooltip = ({ tile }: OccupiableTileTooltipProps) => {
  const { t } = useTranslation();

  return (
    <>
      <span className="font-semibold">{t('Abandoned valley')}</span>
      <TileTooltipLocation tile={tile} />
      <TileTooltipResources tile={tile} />
    </>
  );
};

type OccupiedOccupiableTileTooltipProps = {
  tile: OccupiedOccupiableTile;
};

const OccupiedOccupiableTileTooltip = ({
  tile,
}: OccupiedOccupiableTileTooltipProps) => {
  const { getVillageByCoordinates } = useVillages();
  const { worldItem } = useTileWorldItem(tile.id);

  const village = getVillageByCoordinates(tile.coordinates)!;
  const title = village.name;

  return (
    <>
      <span className="font-semibold">{title}</span>
      <TileTooltipLocation tile={tile} />
      <TileTooltipResources tile={tile} />
      <TileTooltipPlayerInfo tile={tile} />
      {!!worldItem && (
        <div className="flex flex-col gap-1 border-t border-border py-1">
          <TileTooltipWorldItem item={worldItem} />
        </div>
      )}
    </>
  );
};

type TileTooltipSkeletonProps = {
  count: number;
};

const TileTooltipSkeleton = ({ count }: TileTooltipSkeletonProps) => {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton
        variant="dark"
        className="w-25 h-2.5 rounded-xs"
      />
      {[...Array(count).keys()].map((el) => (
        <Skeleton
          key={el}
          variant="dark"
          className="w-20 h-2.5 rounded-xs"
        />
      ))}
    </div>
  );
};

export const TileTooltip = ({ tile }: TileTooltipProps) => {
  if (isOasisTile(tile)) {
    return (
      <div className="flex flex-col gap-1">
        <Suspense fallback={<TileTooltipSkeleton count={3} />}>
          <OasisTileTooltip tile={tile} />
        </Suspense>
      </div>
    );
  }

  if (isOccupiedOccupiableTile(tile)) {
    return (
      <div className="flex flex-col gap-1">
        <Suspense fallback={<TileTooltipSkeleton count={7} />}>
          <OccupiedOccupiableTileTooltip tile={tile} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <OccupiableTileTooltip tile={tile as OccupiableTile} />
    </div>
  );
};
