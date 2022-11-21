import React from 'react';
import { Head } from 'components/common/head';
import { env } from 'config/env';
import { IsometricMap } from 'components/game/map-view/isometric-map';
import { SquareMap } from 'components/game/map-view/square-map';

export const MapView: React.FC = () => {
  return (
    <>
      <Head viewName="map" />
      {env.features.usesIsometricMapStyle ? (
        <IsometricMap />
      ) : (
        <SquareMap />
      )}
    </>
  );
};

// https://stackoverflow.com/questions/45528111/javascript-canvas-map-style-point-zooming
