import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useVillages } from 'app/(game)/(village-slug)/hooks/use-villages';
import {
  isOasisTile,
  isOccupiableOasisTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
} from 'app/(game)/(village-slug)/utils/guards/map-guards';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/utils/icon';
import type {
  OasisResourceBonus,
  OasisTile,
  OccupiableTile,
  OccupiedOccupiableTile,
  Tile,
} from 'app/interfaces/models/game/tile';
import type React from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import {
  calculateDistanceBetweenPoints,
  formatNumber,
  roundToNDecimalPoints,
} from 'app/utils/common';
import { parseRFCFromTile } from 'app/utils/map';
import { useTilePlayer } from 'app/(game)/(village-slug)/(map)/components/hooks/use-tile-player';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useTileTroops } from 'app/(game)/(village-slug)/(map)/components/hooks/use-tile-troops';
import { useTileWorldItem } from 'app/(game)/(village-slug)/(map)/components/hooks/use-tile-world-item';
import { Skeleton } from 'app/components/ui/skeleton';

type TileTooltipProps = {
  tile: Tile;
};

const TileTooltipLocation: React.FC<TileTooltipProps> = ({ tile }) => {
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

const TileTooltipPlayerInfo: React.FC<TileTooltipProps> = ({ tile }) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
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
            {t('Faction')} - {assetsT(`FACTIONS.${faction.toUpperCase()}`)}
          </span>
          <span>
            {t('Reputation')} -{' '}
            {assetsT(`REPUTATIONS.${reputationLevel.toUpperCase()}`)}
          </span>
        </>
      )}
      <span>
        {t('Tribe')} - {assetsT(`TRIBES.${tribe.toUpperCase()}`)}
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

const TileTooltipWorldItem: React.FC<TileTooltipWorldItemProps> = ({
  item,
}) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();

  if (item.type === 'resource') {
    return (
      <span>
        {formatNumber(item.amount)}x {t('resources')}
      </span>
    );
  }

  return (
    <span>
      {formatNumber(item.amount)}x {assetsT(`ITEMS.${item.id}.TITLE`)}
    </span>
  );
};

type TileTooltipAnimalsProps = {
  tile: OasisTile;
};

const TileTooltipAnimals: React.FC<TileTooltipAnimalsProps> = ({ tile }) => {
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

const TileTooltipResources: React.FC<TileTooltipResourcesProps> = ({
  tile,
}) => {
  const resources = parseRFCFromTile(tile.resourceFieldComposition);
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

const OasisTileTooltip: React.FC<OasisTileTooltipProps> = ({ tile }) => {
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

const OccupiableTileTooltip: React.FC<OccupiableTileTooltipProps> = ({
  tile,
}) => {
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

const OccupiedOccupiableTileTooltip: React.FC<
  OccupiedOccupiableTileTooltipProps
> = ({ tile }) => {
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

const TileTooltipSkeleton: React.FC<TileTooltipSkeletonProps> = ({ count }) => {
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

export const TileTooltip: React.FC<TileTooltipProps> = ({ tile }) => {
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
