import type {
  GameEvent,
  GameEventType,
  NewGameEvent,
} from '@pillage-first/types/models/game-event';
import type { ResourceBundle } from '@pillage-first/types/models/resource';
import type { Tile } from '@pillage-first/types/models/tile';
import type { Village } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { insertEventBatch } from '../../utils/insert-events';

export type ResolverResult = {
  affectedVillageIds: (Village['id'] | null)[];
  affectedTileIds: Tile['id'][];
};

export type Resolver<T extends GameEvent> = (
  database: DbFacade,
  args: T,
  createEvents: CreateEvents,
) => ResolverResult;

export type EventCreationArgs<T extends GameEventType | undefined = undefined> =
  Omit<GameEvent<T>, 'id' | 'resolvesAt' | 'startsAt' | 'duration'> & {
    amount?: number;
    startsAt?: number;
    duration?: number;
  };

export type CreateEvents = <T extends GameEventType>(
  database: DbFacade,
  args: EventCreationArgs<T>,
) => void;

type CreationMethods = {
  validate: (now: number) => void;
  // The total for the request, including every row in a batch.
  cost: () => ResourceBundle;
  startTime: () => number;
  duration: (startsAt: number) => number;
  chargeAt: (startsAt: number) => number;
};

type CreationRules = Pick<CreationMethods, 'duration'> &
  Partial<CreationMethods> & {
    afterInsert?: (startsAt: number, now: number) => void;
  };

export type EventResolver<T extends GameEventType> = {
  create: (
    database: DbFacade,
    event: EventCreationArgs<T>,
  ) => CreationMethods & {
    insert: (startsAt: number, duration: number, now: number) => NewGameEvent[];
  };
  resolve: Resolver<GameEvent<T>>;
};

export const defineEventResolver = <T extends GameEventType>(
  createRules: (
    database: DbFacade,
    event: EventCreationArgs<T>,
  ) => CreationRules,
  resolveEvent: Resolver<GameEvent<T>>,
): EventResolver<T> => ({
  create: (database, event) => {
    const { afterInsert, ...methods } = {
      validate: () => undefined,
      cost: (): ResourceBundle => [0, 0, 0, 0],
      startTime: Date.now,
      chargeAt: Date.now,
      ...createRules(database, event),
    };

    return {
      ...methods,
      insert: (startsAt, duration, now) => {
        const events = insertEventBatch(database, event, startsAt, duration);
        afterInsert?.(startsAt, now);
        return events;
      },
    };
  },
  resolve: resolveEvent,
});
