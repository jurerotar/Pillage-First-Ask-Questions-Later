import type { Resolver } from 'interfaces/models/common';
import type { GameEventType } from 'interfaces/models/events/game-event';

export const troopTrainingEventResolver: Resolver<GameEventType.TROOP_TRAINING> = async (_args, _queryClient) => {};
