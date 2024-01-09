import {
  OccupiableTile as OccupiableTileType,
  OasisTile as OasisTileType,
  OccupiedOccupiableTile as OccupiedOccupiableTileType,
  OccupiedOasisTile as OccupiedOasisTileType,
  Tile as TileType,
} from 'interfaces/models/game/tile';
import React, { memo } from 'react';
import { areEqual, GridChildComponentProps } from 'react-window';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import clsx from 'clsx';
import { usePlayers } from 'app/[game]/hooks/use-players';
import { useReputations } from 'app/[game]/hooks/use-reputations';
import { reputationColorMap } from 'app/[game]/utils/color-maps';
import { useMapFilters } from 'app/[game]/[map]/hooks/use-map-filters';
import { OccupiableOasisIcon } from 'app/[game]/[map]/components/occupiable-oasis-icon';
import { WheatFieldIcon } from 'app/[game]/[map]/components/wheat-field-icon';
import { TreasureIcon } from 'app/[game]/[map]/components/treasure-icon';

type CellProps = GridChildComponentProps<{
  map: TileType[];
  openModal: (data?: unknown) => void;
}>;

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
      className="h-3 w-3"
    />
  );
};

type OccupiableTileProps = {
  tile: OccupiableTileType;
};

const OccupiableTile: React.FC<OccupiableTileProps> = ({ tile }) => {
  const wheatFields = ['00018', '11115', '3339'];
  const isWheatField = wheatFields.includes(tile.resourceFieldComposition);

  if (!isWheatField) {
    return null;
  }

  return <WheatFieldIcon resourceFieldComposition={tile.resourceFieldComposition} />;
};

type OccupiedOccupiableTileProps = {
  tile: OccupiedOccupiableTileType;
};

const OccupiedOccupiableTile: React.FC<OccupiedOccupiableTileProps> = ({ tile }) => {
  const { shouldShowFactionReputation, shouldShowTreasureIcons } = useMapFilters();
  const { getPlayerByPlayerId } = usePlayers();
  const { getReputationByFaction } = useReputations();

  const { faction } = getPlayerByPlayerId(tile.ownedBy);
  const reputationLevel = getReputationByFaction(faction)?.reputationLevel;

  const isTileWithTreasury = tile.treasureType !== null;

  return (
    <span
      className={clsx(
        'flex h-full w-full items-start justify-end',
        shouldShowFactionReputation && !!faction && reputationColorMap.get(reputationLevel)!.border,
        shouldShowFactionReputation && 'rounded-[1px] border-[3px] border-dashed'
      )}
    >
      {isTileWithTreasury && shouldShowTreasureIcons && <TreasureIcon treasureType={tile.treasureType} />}
    </span>
  );
};

export const Cell = memo<CellProps>(({ data, style, rowIndex, columnIndex }) => {
  const { map, openModal } = data;

  const { shouldShowWheatFields, shouldShowOasisIcons } = useMapFilters();
  const { mapSize } = useCurrentServer();
  const gridSize = mapSize! + 1;

  const tile: TileType = map[gridSize * rowIndex + columnIndex];

  const isOasis = tile.type === 'oasis-tile';
  const isOccupiableTile = tile.type === 'free-tile';
  const isOccupiedOccupiableTile = isOccupiableTile && Object.hasOwn(tile, 'ownedBy');

  return (
    <button
      type="button"
      className="relative flex h-full w-full justify-end rounded-[1px] border border-gray-500"
      style={{
        ...style,
        backgroundColor: tile.graphics.backgroundColor,
      }}
      data-tile-id={tile.tileId}
      onClick={() => openModal(tile)}
    >
      {isOasis && shouldShowOasisIcons && <OasisTile tile={tile} />}
      {!isOasis && (
        <>
          {isOccupiedOccupiableTile && <OccupiedOccupiableTile tile={tile as OccupiedOccupiableTileType} />}
          {!isOccupiedOccupiableTile && shouldShowWheatFields && <OccupiableTile tile={tile as OccupiedOccupiableTileType} />}
        </>
      )}
    </button>
  );
}, areEqual);
