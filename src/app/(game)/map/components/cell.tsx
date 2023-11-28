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
import clsx from 'clsx';
import { usePlayers } from 'hooks/game/use-players';
import { useReputations } from 'hooks/game/use-reputations';
import { ReputationLevel } from 'interfaces/models/game/reputation';
import { WheatFieldIcon } from 'app/(game)/map/components/wheat-field-icon';
import { TreasureIcon } from 'app/(game)/map/components/treasure-icon';

type CellProps = GridChildComponentProps<TileType[]>;

type OccupiableOasisProps = {
  tile: OasisTileType | OccupiedOasisTileType;
};

const OasisTile: React.FC<OccupiableOasisProps> = ({ tile }) => {
  const { mapFilters: { shouldShowOasisIcons } } = useMapOptions();

  const isOccupiable = tile.oasisBonus !== null;
  const isOccupied = Object.hasOwn(tile, 'villageId');

  return (
    <span
      // id={`tile-id-${tile.tileId}`}
      // data-tooltip-content={tile.oasisBonus}
      className="flex h-full w-full items-start justify-end"
      style={{ backgroundColor: tile.graphics.backgroundColor }}
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

const reputationColorMap = new Map<ReputationLevel, string>([
  ['ecstatic', 'border-purple-800'],
  ['respected', 'border-violet-500'],
  ['friendly', 'border-green-600'],
  ['neutral', 'border-gray-500'],
  ['unfriendly', 'border-yellow-300'],
  ['hostile', 'border-red-600'],
]);

type FreeTileProps = {
  tile: FreeTileType;
};

const FreeTile: React.FC<FreeTileProps> = ({ tile }) => {
  const { mapFilters: { shouldShowWheatFields } } = useMapOptions();

  const wheatFields = ['00018', '11115', '3339'];
  const isWheatField = wheatFields.includes(tile.resourceFieldComposition);

  const [wood, clay, iron, ...wheat] = tile.resourceFieldComposition.split('');
  const readableResourceComposition = `${wood}-${clay}-${iron}-${wheat.join('')}`;

  return (
    <a
      id={`tile-id-${tile.tileId}`}
      data-tooltip-content={readableResourceComposition}
      className="flex h-full w-full items-start justify-end"
      style={{ backgroundColor: tile.graphics.backgroundColor }}
    >
      {isWheatField && shouldShowWheatFields && (
        <WheatFieldIcon resourceFieldComposition={tile.resourceFieldComposition} />
      )}
    </a>
  );
};

type OccupiedFreeTileProps = {
  tile: OccupiedFreeTileType;
};

const OccupiedFreeTile: React.FC<OccupiedFreeTileProps> = ({ tile }) => {
  const { mapFilters: { shouldShowFactionReputation, shouldShowTreasureIcons } } = useMapOptions();
  const { getFactionByPlayerId } = usePlayers();
  const { getReputationByFaction } = useReputations();

  const faction = getFactionByPlayerId(tile.ownedBy);
  const { reputationLevel } = getReputationByFaction(faction);

  const isTileWithTreasury = tile.treasureType !== null;

  return (
    <a
      id={`tile-id-${tile.tileId}`}
      data-tooltip-content={`${faction} - ${reputationLevel}`}
      className={clsx('flex h-full w-full items-start justify-end', (shouldShowFactionReputation && !!faction) && reputationColorMap.get(reputationLevel), shouldShowFactionReputation && 'rounded-[1px] border-[3px] border-dashed')}
      style={{ backgroundColor: tile.graphics.backgroundColor }}
    >
      {isTileWithTreasury && shouldShowTreasureIcons && (
        <TreasureIcon treasureType={tile.treasureType} />
      )}
    </a>
  );
};

export const Cell: React.FC<CellProps> = (props) => {
  const {
    data,
    style,
    rowIndex,
    columnIndex,
  } = props;

  const { server } = useCurrentServer();
  const { mapSize } = server.configuration;
  const gridSize = mapSize! + 1;

  const tile: TileType = data[gridSize * rowIndex + columnIndex];

  const isOasis = tile.type === 'oasis-tile';
  const isFreeTile = tile.type === 'free-tile';
  const isOccupiedFreeTile = isFreeTile && Object.hasOwn(tile, 'ownedBy');

  return (
    <button
      type="button"
      className="relative flex h-full w-full items-center justify-center rounded-[1px] border border-gray-500 text-xs"
      style={style}
    >
      {isOasis && (
        <OasisTile tile={tile} />
      )}
      {!isOasis && (
        <>
          {isOccupiedFreeTile && (
            <OccupiedFreeTile tile={tile as OccupiedFreeTileType} />
          )}
          {!isOccupiedFreeTile && (
            <FreeTile tile={tile as OccupiedFreeTileType} />
          )}
        </>
      )}
    </button>
  );
};
