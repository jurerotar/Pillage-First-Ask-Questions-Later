import { z } from 'zod';
import { factionSchema } from '@pillage-first/types/models/faction';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { tileTypeSchema } from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';

export const getTilesSchema = z
  .strictObject({
    id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    type: tileTypeSchema,

    rfc: resourceFieldCompositionSchema.nullable(),
    oasis_graphics: z.number().nullable(),
    oasis_is_occupiable: z.number().nullable(),

    player_id: z.number().nullable(),
    player_slug: z.string().nullable(),
    player_name: z.string().nullable(),
    player_tribe: tribeSchema.nullable(),
    player_faction: factionSchema.nullable(),

    village_id: z.number().nullable(),
    village_name: z.string().nullable(),
    village_slug: z.string().nullable(),
    population: z.number().nullable(),

    item_id: z.number().nullable(),
  })
  .transform((t) => {
    const isOccupiableTile = t.type === 'free';
    const isOasisTile = !isOccupiableTile;

    const isOccupied = t.player_id !== null;

    return {
      id: t.id,
      type: t.type,
      coordinates: {
        x: t.coordinates_x,
        y: t.coordinates_y,
      },
      ...(isOccupiableTile && {
        attributes: {
          resourceFieldComposition: t.rfc,
        },
        item:
          t.item_id === null
            ? null
            : {
                id: t.item_id,
              },
      }),
      ...(isOasisTile && {
        attributes: {
          oasisGraphics: t.oasis_graphics,
          isOccupiable: t.oasis_is_occupiable === 1,
        },
      }),
      ...(isOccupied && {
        owner: {
          id: t.player_id,
          name: t.player_name,
          slug: t.player_slug,
          tribe: t.player_tribe,
          faction: t.player_faction,
        },
        ownerVillage: {
          id: t.village_id,
          name: t.village_name,
          slug: t.village_slug,
          population: t.population,
        },
      }),
      ...(!isOccupied && {
        owner: null,
        ownerVillage: null,
      }),
    };
  })
  .meta({ id: 'GetTiles' });

export const getTileTroopsSchema = z
  .strictObject({
    unit_id: z.string(),
    amount: z.number(),
    tile_id: z.number(),
    source_tile_id: z.number(),
  })
  .transform((t) => ({
    unitId: t.unit_id,
    amount: t.amount,
    tileId: t.tile_id,
    source: t.source_tile_id,
  }))
  .pipe(
    z.strictObject({
      unitId: z.string(),
      amount: z.number(),
      tileId: z.number(),
      source: z.number(),
    }),
  )
  .meta({ id: 'GetTileTroops' });

export const getTileOasisBonusesSchema = z
  .strictObject({
    resource: resourceSchema,
    bonus: z.number(),
  })
  .transform((t) => ({
    resource: t.resource,
    bonus: t.bonus,
  }))
  .pipe(
    z.strictObject({
      resource: resourceSchema,
      bonus: z.number(),
    }),
  )
  .meta({ id: 'GetTileOasisBonuses' });

export const getTileWorldItemSchema = z
  .strictObject({
    item_id: z.number(),
    amount: z.number(),
  })
  .transform((t) => ({
    id: t.item_id,
    amount: t.amount,
  }))
  .pipe(
    z.strictObject({
      id: z.number(),
      amount: z.number(),
    }),
  )
  .meta({ id: 'GetTileWorldItem' });
