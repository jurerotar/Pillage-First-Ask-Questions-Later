import { z } from 'zod';
import {
  type Resource,
  resourceSchema,
} from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { decodeGraphicsProperty } from '@pillage-first/utils/map';

export const buildingFieldRowSchema = z.strictObject({
  field_id: z.number(),
  building_id: z.string(),
  level: z.number(),
});

export const getVillageBySlugSchema = z
  .strictObject({
    id: z.number(),
    tile_id: z.number(),
    player_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string(),
    resource_field_composition: resourceFieldCompositionSchema,
    last_updated_at: z.number(),
    wood: z.number(),
    clay: z.number(),
    iron: z.number(),
    wheat: z.number(),
    building_fields: z
      .string()
      .transform((s) => (s ? JSON.parse(s) : []))
      .pipe(z.array(buildingFieldRowSchema)),
  })
  .transform((t) => {
    return {
      id: t.id,
      tileId: t.tile_id,
      playerId: t.player_id,
      name: t.name,
      slug: t.slug,
      coordinates: {
        x: t.coordinates_x,
        y: t.coordinates_y,
      },
      lastUpdatedAt: t.last_updated_at,
      resources: {
        wood: t.wood,
        clay: t.clay,
        iron: t.iron,
        wheat: t.wheat,
      },
      resourceFieldComposition: t.resource_field_composition,
      buildingFields: t.building_fields.map((bf) => ({
        id: bf.field_id,
        buildingId: bf.building_id,
        level: bf.level,
      })),
    };
  })
  .pipe(
    z.strictObject({
      id: z.number(),
      tileId: z.number(),
      playerId: z.number(),
      name: z.string(),
      slug: z.string(),
      coordinates: z.strictObject({
        x: z.number(),
        y: z.number(),
      }),
      lastUpdatedAt: z.number(),
      resources: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
      resourceFieldComposition: resourceFieldCompositionSchema,
      buildingFields: z.array(
        z.strictObject({
          id: z.number(),
          buildingId: z.string(),
          level: z.number(),
        }),
      ),
    }),
  )
  .meta({ id: 'GetVillageBySlug' });

export const getOccupiableOasisInRangeSchema = z
  .strictObject({
    tile_id: z.number(),
    tile_coordinates_x: z.number(),
    tile_coordinates_y: z.number(),
    bonuses_json: z.string(),
    oasis_graphics: z.number(),
    occupying_village_id: z.number().nullable(),
    occupying_village_coordinates_x: z.number().nullable(),
    occupying_village_coordinates_y: z.number().nullable(),
    occupying_village_name: z.string().nullable(),
    occupying_village_slug: z.string().nullable(),
    occupying_player_id: z.number().nullable(),
    occupying_player_name: z.string().nullable(),
    occupying_player_slug: z.string().nullable(),
  })
  .transform((t) => {
    const { oasisResource } = decodeGraphicsProperty(t.oasis_graphics);
    const parsedBonuses = JSON.parse(t.bonuses_json) as number[];

    const firstBonus = parsedBonuses.at(0)!;
    const secondBonus = parsedBonuses.at(1);

    // First bonus is always either 50% or 25% and of a specific resource
    const bonuses: { resource: Resource; bonus: number }[] = [
      {
        resource: oasisResource,
        bonus: firstBonus,
      },
    ];

    // If second bonus exists, we know it's a 25% and it must be wheat
    if (secondBonus) {
      bonuses.push({
        resource: 'wheat',
        bonus: 25,
      });
    }

    return {
      oasis: {
        id: t.tile_id,
        coordinates: {
          x: t.tile_coordinates_x,
          y: t.tile_coordinates_y,
        },
        bonuses,
      },
      player:
        t.occupying_player_id === null
          ? null
          : {
              id: t.occupying_player_id,
              name: t.occupying_player_name,
              slug: t.occupying_player_slug,
            },
      village:
        t.occupying_village_id === null
          ? null
          : {
              id: t.occupying_village_id,
              coordinates: {
                x: t.occupying_village_coordinates_x,
                y: t.occupying_village_coordinates_y,
              },
              name: t.occupying_village_name,
              slug: t.occupying_village_slug,
            },
    };
  })
  .pipe(
    z.strictObject({
      oasis: z.strictObject({
        id: z.number(),
        coordinates: z.strictObject({
          x: z.number(),
          y: z.number(),
        }),
        bonuses: z.array(
          z.strictObject({
            resource: resourceSchema,
            bonus: z.number(),
          }),
        ),
      }),
      player: z
        .object({
          id: z.number(),
          name: z.string().nullable(),
          slug: z.string().nullable(),
        })
        .nullable(),
      village: z
        .object({
          id: z.number(),
          coordinates: z.strictObject({
            x: z.number().nullable(),
            y: z.number().nullable(),
          }),
          name: z.string().nullable(),
          slug: z.string().nullable(),
        })
        .nullable(),
    }),
  )
  .meta({ id: 'GetOccupiableOasisInRange' });
