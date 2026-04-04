import type { TroopMovementEvent } from '@pillage-first/types/models/game-event';
import { createController } from '../utils/controller';
import { validateTroopMovementLogic } from '../utils/zod/troop-movement-validation-schema';

export const validateTroopMovement = createController(
  '/troop-movements/validate',
  'post',
)(({ database, body }) => {
  const errors = validateTroopMovementLogic(
    database,
    body as Partial<TroopMovementEvent>,
  );

  return { errors };
});
