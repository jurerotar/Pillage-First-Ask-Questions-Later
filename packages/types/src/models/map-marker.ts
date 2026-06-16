import type { Tile } from './tile';

export const mapMarkerColorPresets = [
  '#dc2626',
  '#2563eb',
  '#16a34a',
  '#ca8a04',
  '#9333ea',
] as const;

export type MapMarkerColor = string;

export type MapMarker = {
  tileId: Tile['id'];
  description: string;
  color: MapMarkerColor;
};
