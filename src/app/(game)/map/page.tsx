import React, { useRef, useState } from 'react';
import { useMap } from 'hooks/game/use-map';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { FixedSizeGrid } from 'react-window';
import { useWindowSize } from 'usehooks-ts';
import { Cell } from 'app/(game)/map/components/cell';

const TILE_BASE_SIZE = 30;

export const MapPage: React.FC = () => {
  const {
    map,
    isLoadingMap
  } = useMap();

  const {
    server,
    isLoadingServer
  } = useCurrentServer();

  const {
    height,
    width
  } = useWindowSize();

  // const { currentVillage } = useCurrentVillage();

  const mapSize = server?.configuration?.mapSize;
  const isLoading = isLoadingMap || isLoadingServer;

  const [magnification, setMagnification] = useState<number>(2);
  const tileSize = TILE_BASE_SIZE * magnification;
  const gridSize = mapSize! + 1;

  const mapRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {isLoading && (
        <p>Map is loading</p>
      )}
      {!isLoading && (
        <FixedSizeGrid
          outerRef={mapRef}
          columnCount={gridSize}
          columnWidth={tileSize}
          rowCount={gridSize}
          rowHeight={tileSize}
          height={height}
          width={width}
          itemData={map}
          overscanColumnCount={5}
          overscanRowCount={5}
        >
          {Cell}
        </FixedSizeGrid>
      )}
    </>
  );
};
