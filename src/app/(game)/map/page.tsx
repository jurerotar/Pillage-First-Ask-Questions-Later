import React from 'react';
import { Head } from 'components/head';
import { IsometricMap } from './components/isometric-map';

export const MapPage: React.FC = () => {
  return (
    <>
      <Head viewName="map" />
      <IsometricMap />
    </>
  );
};

// https://stackoverflow.com/questions/45528111/javascript-canvas-map-style-point-zooming
