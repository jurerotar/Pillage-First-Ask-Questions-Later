import { faro } from '@grafana/faro-web-sdk';
import type { Server } from '@pillage-first/types/models/server';

type ProductEventAttributes = Record<string, string | number | boolean | null>;

const toEventAttributes = (
  attributes: ProductEventAttributes,
): Record<string, string> => {
  const eventAttributes: Record<string, string> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value === null) {
      continue;
    }

    eventAttributes[key] = String(value);
  }

  return eventAttributes;
};

const getGameWorldEventAttributes = (
  server: Server,
): ProductEventAttributes => {
  return {
    game_world_age_days: Math.max(
      0,
      Math.floor((Date.now() - server.createdAt) / 86_400_000),
    ),
    game_world_map_size: server.configuration.mapSize,
    game_world_speed: server.configuration.speed,
    game_world_tribe: server.playerConfiguration.tribe,
    game_world_version: server.version ?? null,
  };
};

const pushProductEvent = (
  name: string,
  attributes: ProductEventAttributes = {},
): void => {
  faro.api?.pushEvent(name, toEventAttributes(attributes), 'product', {
    skipDedupe: true,
  });
};

export const pushGameWorldCreated = (
  server: Server,
  attributes: ProductEventAttributes = {},
): void => {
  pushProductEvent('game_world_created', {
    ...getGameWorldEventAttributes(server),
    ...attributes,
  });
};

export const pushGameWorldDeleted = (server: Server): void => {
  pushProductEvent('game_world_deleted', getGameWorldEventAttributes(server));
};

export const pushGameWorldDuplicated = (server: Server): void => {
  pushProductEvent(
    'game_world_duplicated',
    getGameWorldEventAttributes(server),
  );
};

export const pushGameWorldExported = (server: Server): void => {
  pushProductEvent('game_world_exported', getGameWorldEventAttributes(server));
};

export const pushGameWorldImported = (
  server: Server,
  attributes: ProductEventAttributes = {},
): void => {
  pushProductEvent('game_world_imported', {
    ...getGameWorldEventAttributes(server),
    ...attributes,
  });
};

export const pushGameWorldOpened = (server: Server): void => {
  pushProductEvent('game_world_opened', getGameWorldEventAttributes(server));
};
