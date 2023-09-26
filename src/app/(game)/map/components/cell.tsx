import {
  FreeTile as FreeTileType,
  OasisTile as OasisTileType,
  OccupiedFreeTile as OccupiedFreeTileType,
  OccupiedOasisTile as OccupiedOasisTileType,
  Tile as TileType
} from 'interfaces/models/game/tile';
import React from 'react';
import { GridChildComponentProps } from 'react-window';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { OccupiableOasisIcon } from 'app/(game)/map/components/occupiable-oasis-icon';
import { useMapOptions } from 'app/(game)/map/providers/map-context';

type CellProps = GridChildComponentProps<TileType[]>;

type OccupiableOasisProps = {
  tile: OasisTileType | OccupiedOasisTileType;
};

const OasisTile: React.FC<OccupiableOasisProps> = (props) => {
  const { tile } = props;

  const { mapFilters: { shouldShowOasisIcons } } = useMapOptions();

  const isOccupiable = tile.oasisBonus !== null;
  const isOccupied = Object.hasOwn(tile, 'ownerVillageId');

  return (
    <span
      className="flex h-full w-full items-start justify-end"
      style={{
        backgroundColor: tile.graphics.backgroundColor
      }}
    >
      {shouldShowOasisIcons && isOccupiable && (
        <OccupiableOasisIcon
          oasisType={tile.oasisType}
          oasisBonus={tile.oasisBonus}
          borderVariant={isOccupied ? 'red' : 'green'}
          className="h-3 w-3"
        />
      )}
    </span>
  );
};

type FreeTileProps = {
  tile: FreeTileType | OccupiedFreeTileType;
};

const FreeTile: React.FC<FreeTileProps> = (props) => {
  const { tile } = props;

  return (
    <span
      className="flex h-full w-full"
      style={{ backgroundColor: tile.graphics.backgroundColor }}
    >
      {tile.coordinates.x}, {tile.coordinates.y} {tile.resourceFieldComposition}
    </span>
  );
};

export const Cell: React.FC<CellProps> = (props) => {
  const {
    data,
    style,
    rowIndex,
    columnIndex
  } = props;

  const { server } = useCurrentServer();
  const mapSize = server?.configuration?.mapSize;
  const gridSize = mapSize! + 1;

  const tile: TileType = data[gridSize * rowIndex + columnIndex];

  const isOasis = tile.type === 'oasis-tile';
  const isFreeTile = tile.type === 'free-tile';

  return (
    <button
      type="button"
      className="relative flex h-full w-full items-center justify-center border border-black/25 text-xs hover:border-black"
      style={style}
    >
      {isOasis && (
        <OasisTile tile={tile} />
      )}
      {isFreeTile && (
        <FreeTile tile={tile} />
      )}
    </button>
  );
};
