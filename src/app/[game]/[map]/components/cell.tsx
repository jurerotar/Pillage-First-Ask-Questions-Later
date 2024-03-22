import {
  OasisTile as OasisTileType,
  OccupiableTile as OccupiableTileType,
  OccupiedOasisTile as OccupiedOasisTileType,
  OccupiedOccupiableTile as OccupiedOccupiableTileType,
  Tile as TileType,
} from 'interfaces/models/game/tile';
import React, { memo } from 'react';
import { areEqual, GridChildComponentProps } from 'react-window';
import clsx from 'clsx';
import { reputationColorMap } from 'app/[game]/utils/color-maps';
import { OccupiableOasisIcon } from 'app/[game]/[map]/components/occupiable-oasis-icon';
import { WheatFieldIcon } from 'app/[game]/[map]/components/wheat-field-icon';
import { TreasureIcon } from 'app/[game]/[map]/components/treasure-icon';
import { PlayerFaction } from 'interfaces/models/game/player';
import { ReputationLevel } from 'interfaces/models/game/reputation';
import { MapFilters } from 'interfaces/models/game/map-filters';

type TileWithFilters<T extends TileType> = T & {
  mapFilters: MapFilters;
};

type OccupiableOasisProps = {
  tile: OasisTileType | OccupiedOasisTileType;
};

const OasisTile: React.FC<OccupiableOasisProps> = ({ tile }) => {
  const { oasisResourceBonus } = tile;

  const isOccupiable = tile.oasisResourceBonus.length > 0;
  const isOccupied = Object.hasOwn(tile, 'villageId');

  if (!isOccupiable) {
    return null;
  }

  return (
    <OccupiableOasisIcon
      oasisResourceBonus={oasisResourceBonus}
      borderVariant={isOccupied ? 'red' : 'green'}
      className="size-3"
    />
  );
};

type OccupiableTileProps = {
  tile: TileWithFilters<OccupiableTileType>;
};

const OccupiableTile: React.FC<OccupiableTileProps> = ({ tile }) => {
  const wheatFields = ['00018', '11115', '3339'];
  const isWheatField = wheatFields.includes(tile.resourceFieldComposition);

  if (!isWheatField) {
    return null;
  }

  return <WheatFieldIcon resourceFieldComposition={tile.resourceFieldComposition} />;
};

type OccupiedTileWithFaction = OccupiedOccupiableTileType & {
  faction: PlayerFaction;
  reputationLevel: ReputationLevel;
};

type OccupiedOccupiableTileProps = {
  tile: OccupiedTileWithFaction;
  mapFilters: MapFilters;
};

const OccupiedOccupiableTile: React.FC<OccupiedOccupiableTileProps> = ({ tile, mapFilters }) => {
  const { faction, reputationLevel } = tile;
  const { shouldShowFactionReputation, shouldShowTreasureIcons } = mapFilters;
  const isTileWithTreasury = tile.treasureType !== null;

  return (
    <span
      className={clsx(
        'flex size-full items-start justify-end',
        shouldShowFactionReputation && !!faction && reputationColorMap.get(reputationLevel)!.border,
        shouldShowFactionReputation && 'rounded-[1px] border-[3px] border-dashed'
      )}
    >
      {shouldShowTreasureIcons && isTileWithTreasury && <TreasureIcon treasureType={tile.treasureType} />}
    </span>
  );
};

type CellProps = GridChildComponentProps<{
  tilesWithFactions: (TileType | OccupiedTileWithFaction)[];
  mapFilters: MapFilters;
}>;

export const Cell = memo<CellProps>(({ data, style, rowIndex, columnIndex }) => {
  const { tilesWithFactions, mapFilters } = data;

  const gridSize = Math.sqrt(data.tilesWithFactions.length);

  const tile: TileType | OccupiedTileWithFaction = tilesWithFactions[gridSize * rowIndex + columnIndex];
  const { shouldShowOasisIcons, shouldShowWheatFields } = mapFilters;

  const isOasis = tile.type === 'oasis-tile';
  const isOccupiableTile = tile.type === 'free-tile';
  const isOccupiedOccupiableTile = isOccupiableTile && Object.hasOwn(tile, 'ownedBy');

  return (
    <button
      type="button"
      className="relative flex size-full justify-end rounded-[1px] border border-gray-500"
      style={{
        ...style,
        backgroundColor: tile.graphics.backgroundColor,
      }}
      data-tile-id={tile.id}
    >
      {isOasis && shouldShowOasisIcons && <OasisTile tile={tile} />}
      {!isOasis && (
        <>
          {isOccupiedOccupiableTile && (
            <OccupiedOccupiableTile
              tile={tile as TileWithFilters<OccupiedTileWithFaction>}
              mapFilters={mapFilters}
            />
          )}
          {!isOccupiedOccupiableTile && shouldShowWheatFields && (
            <OccupiableTile tile={tile as TileWithFilters<OccupiedOccupiableTileType>} />
          )}
        </>
      )}
    </button>
  );
}, areEqual);
