import { useTranslation } from 'react-i18next';
import type {
  OasisResourceBonus,
  OasisTile,
  OccupiedOccupiableTile,
} from '@pillage-first/types/models/tile';
import type { WorldItem } from '@pillage-first/types/models/world-item';
import { formatNumber } from '@pillage-first/utils/format';
import { parseResourcesFromRFC } from '@pillage-first/utils/map';
import {
  calculateDistanceBetweenPoints,
  roundToNDecimalPoints,
} from '@pillage-first/utils/math';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  isOccupiableOasisTile,
  isOccupiedOasisTile,
} from 'app/(game)/(village-slug)/utils/guards/map-guards';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Skeleton } from 'app/components/ui/skeleton';

type TileTooltipProps = {
  tileId: number;
};

const TileTooltipLocation = () => {
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

const TileTooltipPlayerInfo = () => {
  const { t } = useTranslation();

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

const TileTooltipAnimals = () => {
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

const TileTooltipResources = () => {
  const resources = parseResourcesFromRFC(tile.resourceFieldComposition);
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

const _OasisTileTooltip = ({ tile }: OasisTileTooltipProps) => {
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
      <TileTooltipLocation />
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
      {isOccupied && <TileTooltipPlayerInfo />}
      {!isOccupied && <TileTooltipAnimals />}
    </>
  );
};

const _OccupiableTileTooltip = () => {
  const { t } = useTranslation();

  return (
    <>
      <span className="font-semibold">{t('Abandoned valley')}</span>
      <TileTooltipLocation />
      <TileTooltipResources />
    </>
  );
};

type OccupiedOccupiableTileTooltipProps = {
  tile: OccupiedOccupiableTile;
};

const _OccupiedOccupiableTileTooltip = ({
  tile,
}: OccupiedOccupiableTileTooltipProps) => {
  const { worldItem } = useTileWorldItem(tile.id);
  const title = village.name;

  return (
    <>
      <span className="font-semibold">{title}</span>
      <TileTooltipLocation />
      <TileTooltipResources />
      <TileTooltipPlayerInfo />
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

const _TileTooltipSkeleton = ({ count }: TileTooltipSkeletonProps) => {
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

export const TileTooltip = (_props: TileTooltipProps) => {};
