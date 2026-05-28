import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { playerSchema } from '@pillage-first/types/models/player';
import { createController } from '../http/controller';
import {
  selectPlayerByIdQuery,
  selectPlayerBySlugQuery,
  selectPlayerVillageListingQuery,
  selectPlayerVillagesWithPopulationQuery,
  selectVillageTroopsQuery,
  updateVillageNameQuery,
} from '../queries/player-queries';
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

export const getMe = createController('/players/me')(({ database }) => {
  return database.selectObject({
    sql: selectPlayerByIdQuery,
    bind: { $player_id: PLAYER_ID },
    schema: playerSchema,
  })!;
});

export const getPlayerVillageListing = createController(
  '/players/:playerId/villages',
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
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectVillageTroopsQuery,
    bind: { $village_id: villageId },
    schema: getTroopsByVillageSchema,
  });

  return rows.map(mapVillageTroop);
});

export const renameVillage = createController(
  '/villages/:villageId',
  'patch',
)(({ database, path: { villageId }, body: { name } }) => {
  database.exec({
    sql: updateVillageNameQuery,
    bind: { $name: name, $village_id: villageId },
  });
});

export const getPlayerBySlug = createController('/players/:playerSlug')(
  ({ database, path: { playerSlug } }) => {
    return database.selectObject({
      sql: selectPlayerBySlugQuery,
      bind: {
        $player_slug: playerSlug,
      },
      schema: playerSchema,
    })!;
  },
);
