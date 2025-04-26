import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTroops } from 'app/(game)/(village-slug)/hooks/use-troops';
import { useVillages } from 'app/(game)/(village-slug)/hooks/use-villages';
import {
  isOasisTile,
  isOccupiableOasisTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
} from 'app/(game)/(village-slug)/utils/guards/map-guards';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/utils/icon';
import type { OasisResourceBonus, OasisTile, OccupiableTile, OccupiedOccupiableTile, Tile } from 'app/interfaces/models/game/tile';
import { factionTranslationMap, reputationLevelTranslationMap, tribeTranslationMap } from 'app/utils/translations';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { useWorldItems } from 'app/(game)/(village-slug)/hooks/use-world-items';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { formatNumber } from 'app/utils/common';
import { parseRFCFromTile } from 'app/utils/map-tile';
import { useTilePlayer } from 'app/(game)/(village-slug)/(map)/hooks/use-tile-player';
import { Resources } from 'app/(game)/(village-slug)/components/resources';

type TileTooltipProps = {
  tile: Tile;
};

const TileTooltipLocation: React.FC<TileTooltipProps> = ({ tile }) => {
  const { t } = useTranslation();
  const { getDistanceFromCurrentVillage } = useCurrentVillage();
  const distance = getDistanceFromCurrentVillage(tile.id);

  return (
    <span className="text-xs text-gray-300">
      ({tile.id}) - {t('{{count}} fields', { count: distance })}
    </span>
  );
};

const TileTooltipPlayerInfo: React.FC<TileTooltipProps> = ({ tile }) => {
  const { t } = useTranslation();
  const { player, reputation, population } = useTilePlayer(tile);

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
            {t('Faction')} - {factionTranslationMap.get(faction)!}
          </span>
          <span>
            {t('Reputation')} - {reputationLevelTranslationMap.get(reputationLevel)!}
          </span>
        </>
      )}
      <span>
        {t('Tribe')} - {tribeTranslationMap.get(tribe)!}
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

const TileTooltipWorldItem: React.FC<TileTooltipWorldItemProps> = ({ item }) => {
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
  const { getTroopsByTileId } = useTroops();
  const troops = getTroopsByTileId(tile.id);

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

const TileTooltipResources: React.FC<TileTooltipResourcesProps> = ({ tile }) => {
  const resources = parseRFCFromTile(tile.RFC, 'number');
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

const OccupiableTileTooltip: React.FC<OccupiableTileTooltipProps> = ({ tile }) => {
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

const OccupiedOccupiableTileTooltip: React.FC<OccupiedOccupiableTileTooltipProps> = ({ tile }) => {
  const { getVillageById } = useVillages();
  const { worldItems } = useWorldItems();

  const worldItem = worldItems.find((item) => tile.id === item.tileId);

  const village = getVillageById(tile.id)!;
  const title = village.name;

  return (
    <>
      <span className="font-semibold">{title}</span>
      <TileTooltipLocation tile={tile} />
      <TileTooltipResources tile={tile} />
      <TileTooltipPlayerInfo tile={tile} />
      {!!worldItem && (
        <div className="flex flex-col gap-1 border-t border-t-gray-400 py-1">
          <TileTooltipWorldItem item={worldItem} />
        </div>
      )}
    </>
  );
};

export const TileTooltip: React.FC<TileTooltipProps> = ({ tile }) => {
  if (isOasisTile(tile)) {
    return (
      <div className="flex flex-col gap-1">
        <OasisTileTooltip tile={tile} />
      </div>
    );
  }

  if (isOccupiedOccupiableTile(tile)) {
    return (
      <div className="flex flex-col gap-1">
        <OccupiedOccupiableTileTooltip tile={tile} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <OccupiableTileTooltip tile={tile as OccupiableTile} />
    </div>
  );
};
