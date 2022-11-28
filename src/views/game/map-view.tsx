import React from 'react';
import { Head } from 'components/common/head';
import { IsometricMap } from 'components/game/map-view/isometric-map';

export const MapView: React.FC = () => {
  return (
    <>
      <Head viewName="map" />
      <IsometricMap />
    </>
  );
};

// https://stackoverflow.com/questions/45528111/javascript-canvas-map-style-point-zooming
