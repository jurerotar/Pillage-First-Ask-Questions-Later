import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/handler';
import { assessAdventureCountQuestCompletion } from '../../utils/quests';
import { createEvents } from '../utils/create-event';

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
