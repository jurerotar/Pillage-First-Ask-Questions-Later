import type { Resolver } from 'app/interfaces/api';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { createEvents } from 'app/(game)/api/handlers/utils/create-event';
import { assessAdventureCountQuestCompletion } from 'app/(game)/api/utils/quests';

export const adventurePointIncreaseResolver: Resolver<
  GameEvent<'adventurePointIncrease'>
> = (database, args) => {
  const { startsAt, duration } = args;

  database.exec('UPDATE hero_adventures SET available = available + 1;');

  assessAdventureCountQuestCompletion(database, startsAt + duration);

  createEvents<'adventurePointIncrease'>(database, {
    // Args need to be present, because next event depends on end of last
    ...args,
    type: 'adventurePointIncrease',
  });
};
