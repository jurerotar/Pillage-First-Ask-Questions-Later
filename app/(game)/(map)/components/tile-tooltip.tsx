import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { usePlayers } from 'app/(game)/hooks/use-players';
import { useReputations } from 'app/(game)/hooks/use-reputations';
import { useTroops } from 'app/(game)/hooks/use-troops';
import { useVillages } from 'app/(game)/hooks/use-villages';
import { calculatePopulationFromBuildingFields } from 'app/(game)/utils/building';
import { isOasisTile, isOccupiableOasisTile, isOccupiedOasisTile, isOccupiedOccupiableTile } from 'app/(game)/utils/guards/map-guards';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/utils/icon';
import type {
  OasisResourceBonus,
  OasisTile,
  OccupiableTile,
  OccupiedOasisTile,
  OccupiedOccupiableTile,
  Tile,
} from 'app/interfaces/models/game/tile';
import { factionTranslationMap, reputationLevelTranslationMap, resourceTranslationMap, tribeTranslationMap } from 'app/utils/translations';
import type React from 'react';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorldItems } from 'app/(game)/hooks/use-world-items';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { formatNumber } from 'app/utils/common';
import { parseCoordinatesFromTileId } from 'app/utils/map-tile';

type TileTooltipProps = {
  tile: Tile;
};

const TileTooltipLocation: React.FC<TileTooltipProps> = ({ tile }) => {
  const { t } = useTranslation();
  const { distanceFromCurrentVillage } = use(CurrentVillageContext);
  const distance = distanceFromCurrentVillage(tile.id);
  const { x, y } = parseCoordinatesFromTileId(tile.id);

  return (
    <span className="text-xs text-gray-300">
      ({x}|{y}) - {t('Fields', { count: distance })}
    </span>
  );
};

const TileTooltipPlayerInfo: React.FC<TileTooltipProps> = ({ tile }) => {
  const { t } = useTranslation();
  const { getVillageByOasis, getVillageById } = useVillages();
  const { getPlayerByPlayerId } = usePlayers();
  const { getReputationByFaction } = useReputations();

  const { playerId, buildingFields, buildingFieldsPresets } =
    tile.type === 'oasis-tile' ? getVillageByOasis(tile as OccupiedOasisTile)! : getVillageById(tile.id)!;
  const { faction, tribe, name } = getPlayerByPlayerId(playerId);
  const { reputationLevel } = getReputationByFaction(faction);
  const population = calculatePopulationFromBuildingFields(buildingFields, buildingFieldsPresets);

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

  if (troops.length === 0) {
    return null;
  }

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

  // Wilderness
  if (!isOccupiable) {
    return (
      <>
        <span className="font-semibold">{title}</span>
        <TileTooltipLocation tile={tile} />
      </>
    );
  }

  return (
    <>
      <span className="font-semibold">{title}</span>
      <TileTooltipLocation tile={tile} />
      {tile.oasisResourceBonus.map(({ resource, bonus }: OasisResourceBonus) => (
        <span
          key={resource}
          className="flex gap-1"
        >
          <Icon
            className="size-4"
            type={resource}
          />
          <span>
            {resourceTranslationMap.get(resource)!} - {bonus}
          </span>
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

  const [wood, clay, iron, ...wheat] = tile.resourceFieldComposition.split('');
  const readableResourceComposition = `${wood}-${clay}-${iron}-${wheat.join('')}`;
  const title = `${t('Abandoned valley')} ${readableResourceComposition}`;

  return (
    <>
      <span className="font-semibold">{title}</span>
      <TileTooltipLocation tile={tile} />
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
  const isOasisCell = isOasisTile(tile);
  const isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);

  return (
    <div className="flex flex-col gap-1">
      {isOasisCell && <OasisTileTooltip tile={tile as OasisTile} />}
      {!isOasisCell && (
        <>
          {isOccupiedOccupiableCell && <OccupiedOccupiableTileTooltip tile={tile as OccupiedOccupiableTile} />}
          {!isOccupiedOccupiableCell && <OccupiableTileTooltip tile={tile as OccupiableTile} />}
        </>
      )}
    </div>
  );
};
