import { z } from 'zod';
import type { Tile } from './tile';

export const mapMarkerIconSchema = z.enum([
  'mapMarker',
  'mapMarkerAttack',
  'mapMarkerDefence',
  'mapMarkerScout',
  'mapMarkerResources',
  'mapMarkerSettlement',
  'mapMarkerDanger',
  'mapMarkerTreasure',
]);

export const mapMarkerColorPresets = [
  '#ffffff',
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
  icon: z.infer<typeof mapMarkerIconSchema>;
};
