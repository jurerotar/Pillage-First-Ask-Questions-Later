import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
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
  OccupiableOasisTile,
  OccupiableTile,
  OccupiedOasisTile,
  OccupiedOccupiableTile,
  Tile,
} from 'app/interfaces/models/game/tile';
import { factionTranslationMap, reputationLevelTranslationMap, resourceTranslationMap, tribeTranslationMap } from 'app/utils/translations';
import type React from 'react';
import { useWorldItems } from 'app/(game)/hooks/use-world-items';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { formatNumber } from 'app/utils/common';
import { Trans } from '@lingui/react/macro';
import { itemsMap } from 'app/assets/items';
import { msg, plural } from '@lingui/core/macro';

type TileTooltipProps = {
  tile: Tile;
};

const TileTooltipLocation: React.FC<TileTooltipProps> = ({ tile }) => {
  const { distanceFromCurrentVillage } = useCurrentVillage();
  const distance = distanceFromCurrentVillage(tile.coordinates);

  return (
    <span className="text-xs text-gray-300">
      ({tile.coordinates.x}|{tile.coordinates.y}) - {msg({ message: plural(distance, { one: 'field', other: 'fields' }) }).message}
    </span>
  );
};

const TileTooltipPlayerInfo: React.FC<TileTooltipProps> = ({ tile }) => {
  const { getVillageByOasis, getVillageByCoordinates } = useVillages();
  const { getPlayerByPlayerId } = usePlayers();
  const { getReputationByFaction } = useReputations();

  const { playerId, buildingFields, buildingFieldsPresets } =
    tile.type === 'oasis-tile' ? getVillageByOasis(tile as OccupiedOasisTile)! : getVillageByCoordinates(tile.coordinates)!;
  const { faction, tribe, name } = getPlayerByPlayerId(playerId);
  const { reputationLevel } = getReputationByFaction(faction);
  const population = calculatePopulationFromBuildingFields(buildingFields, buildingFieldsPresets);

  return (
    <>
      <span>
        <Trans>Player</Trans> - {name}
      </span>
      {faction !== 'player' && (
        <>
          <span>
            <Trans>Faction</Trans> - <Trans>{factionTranslationMap.get(faction)!.message}</Trans>
          </span>
          <span>
            <Trans>Reputation</Trans> - <Trans>{reputationLevelTranslationMap.get(reputationLevel)!.message}</Trans>
          </span>
        </>
      )}
      <span>
        <Trans>Tribe</Trans> - <Trans>{tribeTranslationMap.get(tribe)!.message}</Trans>
      </span>
      <span>
        <Trans>Population</Trans> - {population}
      </span>
    </>
  );
};

type TileTooltipWorldItemProps = {
  item: WorldItem;
};

const TileTooltipWorldItem: React.FC<TileTooltipWorldItemProps> = ({ item }) => {
  if (item.type === 'resource') {
    return <Trans>Bundle of resources - {formatNumber(item.amount)}</Trans>;
  }

  const { name } = itemsMap.get(item.id)!;

  return (
    <span>
      {formatNumber(item.amount)}x <Trans>{name.message}</Trans>
    </span>
  );
};

type TileTooltipAnimalsProps = {
  tile: OccupiableOasisTile;
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
  const isOccupiable = isOccupiableOasisTile(tile);
  const isOccupied = isOccupiedOasisTile(tile);
  const title = (() => {
    if (!isOccupiable) {
      return <Trans>Wilderness</Trans>;
    }
    return isOccupied ? <Trans>Occupied oasis</Trans> : <Trans>Unoccupied oasis</Trans>;
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
            <Trans>{resourceTranslationMap.get(resource)!.message}</Trans> - {bonus}
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
  const [wood, clay, iron, ...wheat] = tile.resourceFieldComposition.split('');
  const readableResourceComposition = `${wood}-${clay}-${iron}-${wheat.join('')}`;

  return (
    <>
      <span className="font-semibold">
        <Trans>Abandoned valley {readableResourceComposition}</Trans>
      </span>
      <TileTooltipLocation tile={tile} />
    </>
  );
};

type OccupiedOccupiableTileTooltipProps = {
  tile: OccupiedOccupiableTile;
};

const OccupiedOccupiableTileTooltip: React.FC<OccupiedOccupiableTileTooltipProps> = ({ tile }) => {
  const { getVillageByCoordinates } = useVillages();
  const { worldItems } = useWorldItems();

  const worldItem = worldItems.find((item) => tile.id === item.tileId);

  const village = getVillageByCoordinates(tile.coordinates)!;
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
