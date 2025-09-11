import type { Resolver } from 'app/interfaces/api';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { adventurePointsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { createEvent } from 'app/(game)/api/handlers/utils/create-event';

export const adventurePointIncreaseResolver: Resolver<
  GameEvent<'adventurePointIncrease'>
> = async (queryClient, database, args) => {
  database.exec('UPDATE hero_adventures SET available = available + 1;');

  await createEvent<'adventurePointIncrease'>(queryClient, database, {
    // Args need to be present, because next events depends on end of last
    ...args,
    type: 'adventurePointIncrease',
    cachesToClearOnResolve: [adventurePointsCacheKey],
  });
};
