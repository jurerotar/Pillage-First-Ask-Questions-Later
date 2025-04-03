import { OccupiableOasisIcon } from 'app/(game)/(village-slug)/(map)/components/occupiable-oasis-icon';
import { WheatFieldIcon } from 'app/(game)/(village-slug)/(map)/components/wheat-field-icon';
import {
  isOccupiableOasisTile,
  isOccupiableTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
} from 'app/(game)/(village-slug)/utils/guards/map-guards';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';
import type { ReputationLevel } from 'app/interfaces/models/game/reputation';
import type {
  OasisTile,
  OccupiableTile,
  OccupiedOccupiableTile as OccupiedOccupiableTileType,
  Tile as TileType,
} from 'app/interfaces/models/game/tile';
import clsx from 'clsx';
import type React from 'react';
import { memo } from 'react';
import { areEqual, type GridChildComponentProps } from 'react-window';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { TreasureIcon } from 'app/(game)/(village-slug)/(map)/components/treasure-icon';

const reputationColorMap = new Map<ReputationLevel, string>([
  ['player', 'after:border-reputation-player'],
  ['ecstatic', 'after:border-reputation-ecstatic'],
  ['respected', 'after:border-reputation-respected'],
  ['friendly', 'after:border-reputation-friendly'],
  ['neutral', 'after:border-reputation-neutral'],
  ['unfriendly', 'after:border-reputation-unfriendly'],
  ['hostile', 'after:border-reputation-hostile'],
]);

export type TileWithClasses = TileType & {
  tileClasses: string;
};

type OccupiedTileWithClasses = TileWithClasses & OccupiedOccupiableTileType;

type TroopMovementsProps = {
  tile: OccupiedTileWithClasses;
};

const _TroopMovements: React.FC<TroopMovementsProps> = ({ tile }) => {
  const _isOccupiableCell = isOccupiableTile(tile);
  const _isOccupiableOasisCell = isOccupiableOasisTile(tile);
  const _isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);

  return null;
};

type CellBaseProps = {
  tilesWithClasses: TileWithClasses[];
  gridSize: number;
  mapFilters: MapFilters;
  onClick: (data: TileWithClasses) => void;
  villageCoordinatesToWorldItemsMap: Map<string, WorldItem>;
};

const wheatFields = ['00018', '11115', '3339'];

type CellIconsProps = Omit<CellBaseProps, 'tilesWithClasses' | 'gridSize'> & {
  tile: TileWithClasses;
};

const CellIcons: React.FC<CellIconsProps> = ({ tile, mapFilters, villageCoordinatesToWorldItemsMap }) => {
  const { shouldShowFactionReputation, shouldShowTreasureIcons, shouldShowOasisIcons, shouldShowWheatFields } = mapFilters;

  const isOccupiableCell = isOccupiableTile(tile);
  const isOccupiableOasisCell = isOccupiableOasisTile(tile);
  const isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);
  const isWorldItemCell = villageCoordinatesToWorldItemsMap.has(tile.id);

  // Determine if any content will render
  const hasContent =
    (isOccupiedOccupiableCell && shouldShowTreasureIcons && isWorldItemCell) || // Treasure icon
    (isOccupiableCell && shouldShowWheatFields && wheatFields.includes((tile as OccupiableTile).RFC)) || // Wheat field icon
    (isOccupiableOasisCell && shouldShowOasisIcons) || // Oasis icon
    // shouldShowTroopMovements || // Troop movements
    (shouldShowFactionReputation && isOccupiedOccupiableCell); // Faction reputation CSS class

  if (!hasContent) {
    return null;
  }

  const shouldShowReputation = shouldShowFactionReputation && isOccupiedOccupiableCell;

  // Okay, this is super hacky, but otherwise the solution is just painful. If we're on occupied-occupiable-tile,
  // there's actually 2 classes in 'tileClasses' variable. First one is reputation level we need for the map

  const [reputationLevel] = tile.tileClasses.split(' ') as [ReputationLevel];

  return (
    <div
      className={clsx(
        'size-full relative',
        shouldShowReputation && `after:absolute after:inset-0 after:z-10 after:rounded-[1px] after:border-[3px] after:border-dashed`,
        shouldShowReputation && reputationColorMap.get(reputationLevel),
      )}
    >
      {isOccupiedOccupiableCell && shouldShowTreasureIcons && isWorldItemCell && (
        <TreasureIcon item={villageCoordinatesToWorldItemsMap.get(tile.id)!} />
      )}

      {isOccupiableCell && shouldShowWheatFields && wheatFields.includes((tile as OccupiableTile).RFC) && <WheatFieldIcon />}

      {isOccupiableOasisCell && shouldShowOasisIcons && (
        <OccupiableOasisIcon
          oasisResourceBonus={(tile as OasisTile).ORB}
          borderVariant={isOccupiedOasisTile(tile) ? 'red' : 'green'}
        />
      )}

      {/*{shouldShowTroopMovements && <TroopMovements tile={tile} />}*/}
    </div>
  );
};

type CellProps = GridChildComponentProps<CellBaseProps>;

export const Cell = memo<CellProps>(({ data, style, rowIndex, columnIndex }) => {
  const { tilesWithClasses, gridSize, ...cellIconsProps } = data;
  const { onClick } = cellIconsProps;

  const tile: TileWithClasses = tilesWithClasses[gridSize * rowIndex + columnIndex];

  return (
    <button
      onClick={() => onClick(tile)}
      type="button"
      className={tile.tileClasses}
      style={style}
      data-tile-id={tile.id}
    >
      <CellIcons
        tile={tile}
        {...cellIconsProps}
      />
    </button>
  );
}, areEqual);
