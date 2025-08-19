import type { Server, ServerModel } from 'app/interfaces/models/game/server';

export const serverApiResource = (serverModel: ServerModel): Server => {
  const {
    id,
    version,
    name,
    slug,
    seed,
    speed,
    map_size,
    created_at,
    player_name,
    player_tribe,
  } = serverModel;

  return {
    id,
    version,
    name,
    slug,
    seed,
    createdAt: created_at,
    configuration: {
      speed,
      mapSize: map_size,
    },
    playerConfiguration: {
      name: player_name,
      tribe: player_tribe,
    },
  };
};
