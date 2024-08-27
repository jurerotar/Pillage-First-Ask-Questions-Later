import { OccupiableOasisIcon } from 'app/[game]/[map]/components/occupiable-oasis-icon';
import { TreasureIcon } from 'app/[game]/[map]/components/treasure-icon';
import { WheatFieldIcon } from 'app/[game]/[map]/components/wheat-field-icon';
import { reputationColorMap } from 'app/[game]/utils/color-maps';
import {
  isOasisTile,
  isOccupiableOasisTile,
  isOccupiableTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
  isTreasuryTile,
} from 'app/[game]/utils/guards/map-guards';
import clsx from 'clsx';
import type { MapFilters } from 'interfaces/models/game/map-filters';
import type { PlayerFaction } from 'interfaces/models/game/player';
import type { ReputationLevel } from 'interfaces/models/game/reputation';
import type {
  OccupiableOasisTile,
  OccupiableTile,
  OccupiedOccupiableTile as OccupiedOccupiableTileType,
  Tile as TileType,
} from 'interfaces/models/game/tile';
import type React from 'react';
import { memo } from 'react';
import { type GridChildComponentProps, areEqual } from 'react-window';
import cellStyles from './cell.module.scss';

type OccupiedTileWithFaction = OccupiedOccupiableTileType & {
  faction: PlayerFaction;
  reputationLevel: ReputationLevel;
};

type TroopMovementsProps = {
  tile: TileType | OccupiedTileWithFaction;
};

const TroopMovements: React.FC<TroopMovementsProps> = ({ tile }) => {
  const _isOccupiableCell = isOccupiableTile(tile);
  const _isOccupiableOasisCell = isOccupiableOasisTile(tile);
  const _isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);

  return null;
};

type CellBaseProps = {
  tilesWithFactions: (TileType | OccupiedTileWithFaction)[];
  mapFilters: MapFilters;
  magnification: number;
};

type CellIconsProps = Omit<CellBaseProps, 'tilesWithFactions'> & { tile: TileType | OccupiedTileWithFaction };

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
            (tile as OccupiedTileWithFaction).reputationLevel,
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

export const Cell = memo<CellProps>(({ data, style, rowIndex, columnIndex }) => {
  const { tilesWithFactions, mapFilters, magnification } = data;

  const gridSize = Math.sqrt(data.tilesWithFactions.length);

  const tile: TileType | OccupiedTileWithFaction = tilesWithFactions[gridSize * rowIndex + columnIndex];

  const isOasisCell = isOasisTile(tile);
  const isOccupiableTileCell = isOccupiableTile(tile);

  return (
    <button
      type="button"
      className={clsx(
        isOccupiableTileCell && cellStyles['free-tile'],
        isOccupiableTileCell && cellStyles[`free-tile-${tile.resourceFieldComposition}`],
        isOasisCell && cellStyles.oasis,
        isOasisCell && cellStyles[`oasis-${tile.graphics.oasisResource}`],
        isOasisCell && cellStyles[`oasis-${tile.graphics.oasisResource}-group-${tile.graphics.oasisGroup}`],
        isOasisCell &&
          cellStyles[
            `oasis-${tile.graphics.oasisResource}-group-${tile.graphics.oasisGroup}-position-${tile.graphics.oasisGroupPosition.join('-')}`
          ],
        'flex size-full rounded-[1px] border border-gray-500',
      )}
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
