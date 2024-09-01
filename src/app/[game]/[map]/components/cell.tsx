import { OccupiableOasisIcon } from 'app/[game]/[map]/components/occupiable-oasis-icon';
import { TreasureIcon } from 'app/[game]/[map]/components/treasure-icon';
import { WheatFieldIcon } from 'app/[game]/[map]/components/wheat-field-icon';
import {
  isOccupiableOasisTile,
  isOccupiableTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
  isTreasuryTile,
  isUnoccupiedOccupiableTile,
} from 'app/[game]/utils/guards/map-guards';
import clsx from 'clsx';
import type { MapFilters } from 'interfaces/models/game/map-filters';
import type { PlayerFaction } from 'interfaces/models/game/player';
import type { ReputationLevel } from 'interfaces/models/game/reputation';
import type {
  OasisTile,
  OccupiableOasisTile,
  OccupiableTile,
  OccupiedOccupiableTile as OccupiedOccupiableTileType,
  Tile as TileType,
} from 'interfaces/models/game/tile';
import type { Tribe } from 'interfaces/models/game/tribe';
import type React from 'react';
import { memo } from 'react';
import { type GridChildComponentProps, areEqual } from 'react-window';
import cellStyles from './cell.module.scss';

export const reputationColorMap = new Map<ReputationLevel, string>([
  ['player', 'after:border-reputation-player'],
  ['ecstatic', 'after:border-reputation-ecstatic'],
  ['respected', 'after:border-reputation-respected'],
  ['friendly', 'after:border-reputation-friendly'],
  ['neutral', 'after:border-reputation-neutral'],
  ['unfriendly', 'after:border-reputation-unfriendly'],
  ['hostile', 'after:border-reputation-hostile'],
]);

type OccupiedTileWithFactionAndTribe = OccupiedOccupiableTileType & {
  faction: PlayerFaction;
  reputationLevel: ReputationLevel;
  tribe: Tribe;
};

type TroopMovementsProps = {
  tile: TileType | OccupiedTileWithFactionAndTribe;
};

const TroopMovements: React.FC<TroopMovementsProps> = ({ tile }) => {
  const _isOccupiableCell = isOccupiableTile(tile);
  const _isOccupiableOasisCell = isOccupiableOasisTile(tile);
  const _isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);

  return null;
};

type CellBaseProps = {
  tilesWithFactions: (TileType | OccupiedTileWithFactionAndTribe)[];
  mapFilters: MapFilters;
  magnification: number;
};

type CellIconsProps = Omit<CellBaseProps, 'tilesWithFactions'> & { tile: TileType | OccupiedTileWithFactionAndTribe };

const CellIcons: React.FC<CellIconsProps> = ({ tile, mapFilters }) => {
  const { shouldShowFactionReputation, shouldShowTreasureIcons, shouldShowOasisIcons, shouldShowWheatFields, shouldShowTroopMovements } =
    mapFilters;

  const isOccupiableCell = isOccupiableTile(tile);
  const isOccupiableOasisCell = isOccupiableOasisTile(tile);
  const isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);
  const isOccupiedOasisCell = isOccupiedOasisTile(tile);

  const wheatFields = ['00018', '11115', '3339'];

  return (
    <div
      className={clsx(
        'size-full relative',
        shouldShowFactionReputation &&
          (isOccupiedOccupiableCell || isOccupiedOasisCell) &&
          `after:absolute after:top-0 after:left-0 after:size-full after:rounded-[1px] after:border-[3px] after:border-dashed ${reputationColorMap.get(
            (tile as OccupiedTileWithFactionAndTribe).reputationLevel,
          )!}`,
      )}
    >
      {isOccupiedOccupiableCell && shouldShowTreasureIcons && isTreasuryTile(tile) && <TreasureIcon treasureType={tile.treasureType} />}

      {isOccupiableCell && shouldShowWheatFields && wheatFields.includes((tile as OccupiableTile).resourceFieldComposition) && (
        <WheatFieldIcon resourceFieldComposition={(tile as OccupiableTile).resourceFieldComposition} />
      )}

      {isOccupiableOasisCell && shouldShowOasisIcons && (
        <OccupiableOasisIcon
          oasisResourceBonus={(tile as OccupiableOasisTile).oasisResourceBonus}
          borderVariant={isOccupiedOasisTile(tile) ? 'red' : 'green'}
        />
      )}

      {shouldShowTroopMovements && <TroopMovements tile={tile} />}
    </div>
  );
};

type CellProps = GridChildComponentProps<CellBaseProps>;

const dynamicCellClasses = (tile: TileType | OccupiedTileWithFactionAndTribe): string => {
  const isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);
  const isUnoccupiedOccupiableCell = isUnoccupiedOccupiableTile(tile);

  if (isUnoccupiedOccupiableCell) {
    const cell = tile as OccupiableTile;
    return clsx(cellStyles['unoccupied-tile'], cellStyles[`unoccupied-tile-${cell.resourceFieldComposition}`]);
  }

  if (isOccupiedOccupiableCell) {
    const cell = tile as OccupiedTileWithFactionAndTribe;
    return clsx(
      cellStyles['occupied-tile'],
      cellStyles[`occupied-tile-${cell.tribe}`],
      cellStyles[`occupied-tile-${cell.tribe}-${cell.villageSize}`],
    );
  }

  const cell = tile as OasisTile;

  return clsx(
    cellStyles.oasis,
    cellStyles[`oasis-${cell.graphics.oasisResource}`],
    cellStyles[`oasis-${cell.graphics.oasisResource}-group-${cell.graphics.oasisGroup}`],
    cellStyles[
      `oasis-${cell.graphics.oasisResource}-group-${cell.graphics.oasisGroup}-position-${cell.graphics.oasisGroupPosition.join('-')}`
    ],
  );
};

export const Cell = memo<CellProps>(({ data, style, rowIndex, columnIndex }) => {
  const { tilesWithFactions, mapFilters, magnification } = data;

  const gridSize = Math.sqrt(data.tilesWithFactions.length);

  const tile: TileType | OccupiedTileWithFactionAndTribe = tilesWithFactions[gridSize * rowIndex + columnIndex];

  return (
    <button
      type="button"
      className={clsx(dynamicCellClasses(tile), 'flex size-full rounded-[1px] border border-gray-500/50 bg-contain')}
      style={style}
      data-tile-id={tile.id}
    >
      <CellIcons
        mapFilters={mapFilters}
        magnification={magnification}
        tile={tile}
      />
    </button>
  );
}, areEqual);
