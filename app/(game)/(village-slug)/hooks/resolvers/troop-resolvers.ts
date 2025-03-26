import type { Resolver } from 'app/interfaces/models/common';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const troopTrainingEventResolver: Resolver<GameEvent<'troopTraining'>> = async (_args, _queryClient) => {};
