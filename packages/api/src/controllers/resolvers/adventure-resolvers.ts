import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import { createEvents } from '../utils/create-event';

export const adventurePointIncreaseResolver: Resolver<
  GameEvent<'adventurePointIncrease'>
> = (database, args) => {
  const { resolvesAt } = args;

  database.exec({
    sql: 'UPDATE hero_adventures SET available = available + 1;',
  });

  createEvents<'adventurePointIncrease'>(database, {
    villageId: null,
    startsAt: resolvesAt,
    type: 'adventurePointIncrease',
  });
};
