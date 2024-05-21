import { OccupiableOasisIcon } from 'app/[game]/[map]/components/occupiable-oasis-icon';
import { TreasureIcon } from 'app/[game]/[map]/components/treasure-icon';
import { WheatFieldIcon } from 'app/[game]/[map]/components/wheat-field-icon';
import { reputationColorMap } from 'app/[game]/utils/color-maps';
import {
  isOasisTile,
  isOccupiableOasisTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
  isTreasuryTile,
} from 'app/[game]/utils/guards/map-guards';
import clsx from 'clsx';
import type { MapFilters } from 'interfaces/models/game/map-filters';
import type { PlayerFaction } from 'interfaces/models/game/player';
import type { ReputationLevel } from 'interfaces/models/game/reputation';
import type {
  OasisTile as OasisTileType,
  OccupiableTile as OccupiableTileType,
  OccupiedOasisTile as OccupiedOasisTileType,
  OccupiedOccupiableTile as OccupiedOccupiableTileType,
  Tile as TileType,
} from 'interfaces/models/game/tile';
import type React from 'react';
import { memo } from 'react';
import { type GridChildComponentProps, areEqual } from 'react-window';
import cellStyles from './cell.module.scss';

type TileWithFilters<T extends TileType> = T & {
  mapFilters: MapFilters;
};

type OccupiableOasisProps = {
  tile: OasisTileType | OccupiedOasisTileType;
};

const OasisTile: React.FC<OccupiableOasisProps> = ({ tile }) => {
  const { oasisResourceBonus } = tile;

  const isOccupied = isOccupiedOasisTile(tile);

  return (
    <>
      <OccupiableOasisIcon
        oasisResourceBonus={oasisResourceBonus}
        borderVariant={isOccupied ? 'red' : 'green'}
        className="size-2 md:size-3"
      />
    </>
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
  const isTileWithTreasury = isTreasuryTile(tile);

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
  const { shouldShowOasisIcons, shouldShowWheatFields } = mapFilters;

  const gridSize = Math.sqrt(data.tilesWithFactions.length);

  const tile: TileType | OccupiedTileWithFaction = tilesWithFactions[gridSize * rowIndex + columnIndex];

  const isOasisCell = isOasisTile(tile);
  const isOccupiableOasisCell = isOccupiableOasisTile(tile);
  const isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);

  return (
    <button
      type="button"
      className={clsx(
        isOasisCell && cellStyles.oasis,
        isOasisCell && cellStyles[`oasis-${tile.graphics.oasisResource}`],
        isOasisCell && cellStyles[`oasis-${tile.graphics.oasisResource}-group-${tile.graphics.oasisGroup}`],
        isOasisCell &&
          cellStyles[
            `oasis-${tile.graphics.oasisResource}-group-${tile.graphics.oasisGroup}-position-${tile.graphics.oasisGroupPosition.join('-')}`
          ],
        'relative flex size-full justify-end rounded-[1px] border border-gray-500'
      )}
      style={style}
      data-tile-id={tile.id}
    >
      {isOasisCell && isOccupiableOasisCell && shouldShowOasisIcons && <OasisTile tile={tile as OasisTileType} />}
      {!isOasisCell && (
        <>
          {isOccupiedOccupiableCell && (
            <OccupiedOccupiableTile
              tile={tile as TileWithFilters<OccupiedTileWithFaction>}
              mapFilters={mapFilters}
            />
          )}
          {!isOccupiedOccupiableCell && shouldShowWheatFields && (
            <OccupiableTile tile={tile as TileWithFilters<OccupiedOccupiableTileType>} />
          )}
        </>
      )}
    </button>
  );
}, areEqual);
