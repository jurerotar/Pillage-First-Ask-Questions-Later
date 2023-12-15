import {
  OccupiableTile as OccupiableTileType,
  OasisTile as OasisTileType,
  OccupiedOccupiableTile as OccupiedOccupiableTileType,
  OccupiedOasisTile as OccupiedOasisTileType,
  Tile as TileType
} from 'interfaces/models/game/tile';
import React from 'react';
import { GridChildComponentProps } from 'react-window';
import { useCurrentServer } from 'hooks/game/use-current-server';
import clsx from 'clsx';
import { usePlayers } from 'hooks/game/use-players';
import { useReputations } from 'hooks/game/use-reputations';
import { ReputationLevel } from 'interfaces/models/game/reputation';
import { useMapOptions } from '../providers/map-context';
import { OccupiableOasisIcon } from './occupiable-oasis-icon';
import { WheatFieldIcon } from './wheat-field-icon';
import { TreasureIcon } from './treasure-icon';

type CellProps = GridChildComponentProps<{
  map: TileType[];
  openModal: () => void;
  setModalContents: React.Dispatch<React.SetStateAction<React.ReactNode>>;
}>;

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

type OccupiableTileProps = {
  tile: OccupiableTileType;
};

const OccupiableTile: React.FC<OccupiableTileProps> = ({ tile }) => {
  const { mapFilters: { shouldShowWheatFields } } = useMapOptions();

  const wheatFields = ['00018', '11115', '3339'];
  const isWheatField = wheatFields.includes(tile.resourceFieldComposition);

  const [wood, clay, iron, ...wheat] = tile.resourceFieldComposition.split('');
  const readableResourceComposition = `${wood}-${clay}-${iron}-${wheat.join('')}`;

  return (
    <span
      id={`tile-id-${tile.tileId}`}
      data-tooltip-content={readableResourceComposition}
      className="flex h-full w-full items-start justify-end"
      style={{ backgroundColor: tile.graphics.backgroundColor }}
    >
      {isWheatField && shouldShowWheatFields && (
        <WheatFieldIcon resourceFieldComposition={tile.resourceFieldComposition} />
      )}
    </span>
  );
};

type OccupiedOccupiableTileProps = {
  tile: OccupiedOccupiableTileType;
};

const OccupiedOccupiableTile: React.FC<OccupiedOccupiableTileProps> = ({ tile }) => {
  const { mapFilters: { shouldShowFactionReputation, shouldShowTreasureIcons } } = useMapOptions();
  const { getFactionByPlayerId } = usePlayers();
  const { getReputationByFaction } = useReputations();

  const faction = getFactionByPlayerId(tile.ownedBy);
  const { reputationLevel } = getReputationByFaction(faction);

  const isTileWithTreasury = tile.treasureType !== null;

  return (
    <span
      id={`tile-id-${tile.tileId}`}
      data-tooltip-content={`${faction} - ${reputationLevel}`}
      className={clsx('flex h-full w-full items-start justify-end', (shouldShowFactionReputation && !!faction) && reputationColorMap.get(reputationLevel), shouldShowFactionReputation && 'rounded-[1px] border-[3px] border-dashed')}
      style={{ backgroundColor: tile.graphics.backgroundColor }}
    >
      {isTileWithTreasury && shouldShowTreasureIcons && (
        <TreasureIcon treasureType={tile.treasureType} />
      )}
    </span>
  );
};

const A = () => {
  console.log('burek');

  return null;
};

export const Cell: React.FC<CellProps> = ({ data, style, rowIndex, columnIndex }) => {
  const { map, openModal, setModalContents } = data;

  const { server } = useCurrentServer();
  const { mapSize } = server.configuration;
  const gridSize = mapSize! + 1;

  const tile: TileType = map[gridSize * rowIndex + columnIndex];

  const isOasis = tile.type === 'oasis-tile';
  const isOccupiableTile = tile.type === 'free-tile';
  const isOccupiedOccupiableTile = isOccupiableTile && Object.hasOwn(tile, 'ownedBy');

  return (
    <button
      type="button"
      className="relative flex h-full w-full items-center justify-center rounded-[1px] border border-gray-500"
      style={style}
      onClick={() => {
        setModalContents(<A />);
        openModal();
      }}
    >
      {isOasis && (
        <OasisTile tile={tile} />
      )}
      {!isOasis && (
        <>
          {isOccupiedOccupiableTile && (
            <OccupiedOccupiableTile tile={tile as OccupiedOccupiableTileType} />
          )}
          {!isOccupiedOccupiableTile && (
            <OccupiableTile tile={tile as OccupiedOccupiableTileType} />
          )}
        </>
      )}
    </button>
  );
};
