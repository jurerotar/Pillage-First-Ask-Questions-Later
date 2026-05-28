import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  playerVillageDtoSchema,
  playerVillageWithPopulationDtoSchema,
  villageTroopDtoSchema,
} from '@pillage-first/types/dtos/player';
import { playerSchema } from '@pillage-first/types/models/player';
import {
  selectPlayerByIdQuery,
  selectPlayerBySlugQuery,
  selectPlayerVillageListingQuery,
  selectPlayerVillagesWithPopulationQuery,
  selectVillageTroopsQuery,
  updateVillageNameQuery,
} from '../../queries/player-queries';
import { createController } from '../controller';
import {
  mapPlayerVillage,
  mapPlayerVillageWithPopulation,
  mapVillageTroop,
} from './mappers/player-mapper';
import {
  getPlayerVillagesWithPopulationSchema,
  getTroopsByVillageSchema,
  getVillagesByPlayerSchema,
} from './schemas/player-schemas';

export const getMe = createController('/players/me', {
  summary: 'Get current player details',
  response: playerSchema,
})(({ database }) => {
  return database.selectObject({
    sql: selectPlayerByIdQuery,
    bind: { $player_id: PLAYER_ID },
    schema: playerSchema,
  })!;
});

export const getPlayerVillageListing = createController(
  '/players/:playerId/villages',
  {
    summary: 'Get player village listing',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: z.array(playerVillageDtoSchema),
  },
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectPlayerVillageListingQuery,
    bind: { $player_id: playerId },
    schema: getVillagesByPlayerSchema,
  });

  return rows.map(mapPlayerVillage);
});

export const getPlayerVillagesWithPopulation = createController(
  '/players/:playerId/villages-with-population',
  {
    summary: 'Get player villages with population',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: z.array(playerVillageWithPopulationDtoSchema),
  },
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectPlayerVillagesWithPopulationQuery,
    bind: { $player_id: playerId },
    schema: getPlayerVillagesWithPopulationSchema,
  });

  return rows.map(mapPlayerVillageWithPopulation);
});

export const getTroopsByVillage = createController(
  '/villages/:villageId/troops',
  {
    summary: 'Get troops by village',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(villageTroopDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectVillageTroopsQuery,
    bind: { $village_id: villageId },
    schema: getTroopsByVillageSchema,
  });

  return rows.map(mapVillageTroop);
});

export const renameVillage = createController('/villages/:villageId', 'patch', {
  summary: 'Rename village',
  requestParams: {
    path: z.strictObject({
      villageId: z.coerce.number(),
    }),
  },
  requestBody: z.strictObject({
    name: z.string(),
  }),
})(({ database, path: { villageId }, body: { name } }) => {
  database.exec({
    sql: updateVillageNameQuery,
    bind: { $name: name, $village_id: villageId },
  });
});

export const getPlayerBySlug = createController('/players/:playerSlug', {
  summary: 'Get player by slug',
  requestParams: {
    path: z.strictObject({
      playerSlug: playerSchema.shape.slug,
    }),
  },
  response: playerSchema,
})(({ database, path: { playerSlug } }) => {
  return database.selectObject({
    sql: selectPlayerBySlugQuery,
    bind: {
      $player_slug: playerSlug,
    },
    schema: playerSchema,
  })!;
});
