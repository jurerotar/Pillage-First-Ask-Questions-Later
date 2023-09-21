import { Tile } from 'interfaces/models/game/tile';
import React from 'react';
import { GridChildComponentProps } from 'react-window';
import { useCurrentServer } from 'hooks/game/use-current-server';

type CellProps = GridChildComponentProps<Tile[]>;

export const Cell: React.FC<CellProps> = (props) => {
  const { data, style, rowIndex, columnIndex } = props;

  const { server } = useCurrentServer();
  const mapSize = server?.configuration?.mapSize;
  const gridSize = mapSize! + 1;

  const tile: Tile = data[gridSize * rowIndex + columnIndex];

  return (
    <button
      type="button"
      className="flex h-full w-full items-center justify-center border border-black/25 text-xs hover:font-semibold"
      style={{
        ...style,
        backgroundColor: tile.backgroundColor
      }}
    >
      {tile.coordinates.x}, {tile.coordinates.y}
    </button>
  );
};
