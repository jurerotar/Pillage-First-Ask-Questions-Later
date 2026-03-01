import { z } from 'zod';
import { playableTribeSchema } from './tribe';

export const mapSizeSchema = z
  .union([z.literal(100), z.literal(200), z.literal(300)])
  .meta({ id: 'ServerMapSize' });

export const speedSchema = z
  .union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(5),
    z.literal(10),
  ])
  .meta({ id: 'ServerSpeed' });

export const serverDbSchema = z
  .strictObject({
    id: z.string(),
    version: z.string(),
    name: z.string(),
    slug: z.string(),
    created_at: z.number(),
    seed: z.string(),
    map_size: mapSizeSchema,
    speed: speedSchema,
    player_name: z.string(),
    player_tribe: playableTribeSchema,
  })
  .transform((t) => {
    return {
      id: t.id,
      version: t.version,
      name: t.name,
      slug: t.slug,
      createdAt: t.created_at,
      seed: t.seed,
      configuration: {
        mapSize: t.map_size,
        speed: t.speed,
      },
      playerConfiguration: {
        name: t.player_name,
        tribe: t.player_tribe,
      },
    };
  })
  .meta({ id: 'ServerDb' });

export const serverSchema = z
  .strictObject({
    id: z.string(),
    version: z.string(),
    name: z.string(),
    slug: z.string(),
    createdAt: z.number(),
    seed: z.string(),
    configuration: z.strictObject({
      mapSize: mapSizeSchema,
      speed: speedSchema,
    }),
    playerConfiguration: z.strictObject({
      name: z.string(),
      tribe: playableTribeSchema,
    }),
  })
  .meta({ id: 'Server' });

export type Server = z.infer<typeof serverSchema>;
