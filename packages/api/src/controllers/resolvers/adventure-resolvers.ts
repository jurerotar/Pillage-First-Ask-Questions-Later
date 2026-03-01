import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import { createEvents } from '../utils/create-event';

export const adventurePointIncreaseResolver: Resolver<
  GameEvent<'adventurePointIncrease'>
> = (database, args) => {
  database.exec({
    sql: 'UPDATE hero_adventures SET available = available + 1;',
  });

  createEvents<'adventurePointIncrease'>(database, {
    // Args need to be present, because next event depends on end of last
    ...args,
    type: 'adventurePointIncrease',
  });
};
