import { z } from 'zod';
import { factionSchema } from '@pillage-first/types/models/faction';
import { mapMarkerIconSchema } from '@pillage-first/types/models/map-marker';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import {
  oasisBonusTypeSchema,
  tileIdSchema,
  tileTypeSchema,
} from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const getTilesSchema = z
  .strictObject({
    id: tileIdSchema,
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    type: tileTypeSchema,

    rfc: resourceFieldCompositionSchema.nullable(),
    oasis_graphics: z.number().nullable(),
    oasis_bonus_type: oasisBonusTypeSchema,

    player_id: z.number().nullable(),
    player_slug: z.string().nullable(),
    player_name: z.string().nullable(),
    player_tribe: tribeSchema.nullable(),
    player_faction: factionSchema.nullable(),

    village_id: z.number().nullable(),
    village_name: z.string().nullable(),
    village_slug: z.string().nullable(),
    population: z.number().nullable(),
  })
  .meta({ id: 'GetTilesRow' });

export const getTilesJsonSchema = z
  .string()
  .transform((value): unknown => JSON.parse(value))
  .pipe(z.array(z.unknown()))
  .transform((rows, context) =>
    rows.map((row, index): unknown => {
      if (!Array.isArray(row) || row.length !== 16) {
        context.addIssue({
          code: 'custom',
          path: [index],
          message: 'Expected 16 map tile columns',
        });
        return z.NEVER;
      }
      // Column order is defined by selectMapTilesQuery; validate the decoded object below.
      return {
        id: row[0],
        coordinates_x: row[1],
        coordinates_y: row[2],
        type: row[3],
        rfc: row[4],
        oasis_graphics: row[5],
        oasis_bonus_type: row[6],
        village_id: row[7],
        village_name: row[8],
        village_slug: row[9],
        player_id: row[10],
        player_slug: row[11],
        player_name: row[12],
        player_tribe: row[13],
        player_faction: row[14],
        population: row[15],
      };
    }),
  )
  .pipe(z.array(getTilesSchema));

export const getTileTroopsSchema = z
  .strictObject({
    unit_id: unitIdSchema,
    amount: z.number(),
    tile_id: tileIdSchema,
    source_tile_id: tileIdSchema,
  })
  .meta({ id: 'GetTileTroopsRow' });

export const getTileOasisBonusesSchema = z
  .strictObject({
    resource: resourceSchema,
    bonus: z.number(),
  })
  .meta({ id: 'GetTileOasisBonusesRow' });

export const getMapMarkersSchema = z
  .strictObject({
    icon: mapMarkerIconSchema,
    tile_id: tileIdSchema,
    description: z.string(),
    color: z.string().regex(/^#[\dA-Fa-f]{6}$/u),
  })
  .meta({ id: 'GetMapMarkersRow' });
