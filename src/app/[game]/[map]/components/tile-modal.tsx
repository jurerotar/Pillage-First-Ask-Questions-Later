import React from 'react';
import { OasisTile, OccupiableTile, OccupiedOccupiableTile, Tile } from 'interfaces/models/game/tile';

type TileModalProps = {
  tile: Tile;
};

const TileModalLocation: React.FC<TileModalProps> = ({ tile }) => {
  return (
    <></>
  );
};

const TileModalReports: React.FC<TileModalProps> = ({ tile }) => {
  return (
    <>
    </>
  );
};

type OasisTileModalProps = {
  tile: OasisTile;
};

const OasisTileModal: React.FC<OasisTileModalProps> = ({ tile }) => {
  return (
    <>
    </>
  );
};

type OccupiableTileModalProps = {
  tile: OccupiableTile;
};

const OccupiableTileModal: React.FC<OccupiableTileModalProps> = ({ tile }) => {
  return (
    <>
    </>
  );
};

type OccupiedOccupiableTileModalProps = {
  tile: OccupiedOccupiableTile;
};

const OccupiedOccupiableTileModal: React.FC<OccupiedOccupiableTileModalProps> = ({ tile }) => {
  return (
    <>
    </>
  );
};

export const TileModal: React.FC<TileModalProps> = ({ tile }) => {
  const isOasis = tile.type === 'oasis-tile';
  const isOccupiableTile = tile.type === 'free-tile';
  const isOccupiedOccupiableTile = isOccupiableTile && Object.hasOwn(tile, 'ownedBy');

  return (
    <div className="flex flex-col gap-1">
      {isOasis && <OasisTileModal tile={tile} />}
      {!isOasis && (
        <>
          {isOccupiedOccupiableTile && <OccupiedOccupiableTileModal tile={tile as OccupiedOccupiableTile} />}
          {!isOccupiedOccupiableTile && <OccupiableTileModal tile={tile} />}
        </>
      )}
    </div>
  );
};
