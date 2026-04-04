import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import z from 'zod';
import type { Coordinates } from '@pillage-first/types/models/coordinates';
import type { TroopMovementEventType } from '@pillage-first/types/models/game-event';
import type { Troop } from '@pillage-first/types/models/troop';
import { ApiContext } from 'app/(game)/providers/api-provider';

type ValidateTroopMovementArgs = {
  type: TroopMovementEventType;
  troops: Troop[];
  originCoordinates: Coordinates;
  targetCoordinates: Coordinates;
  villageId: number;
};

const validateTroopMovementSchema = z.strictObject({
  errors: z.array(z.string()),
});

type ValidateTroopMovementResponse = z.infer<
  typeof validateTroopMovementSchema
>;

export const useValidateTroopMovement = () => {
  const { fetcher } = use(ApiContext);

  const { mutateAsync: validateTroopMovement } = useMutation<
    ValidateTroopMovementResponse,
    Error,
    ValidateTroopMovementArgs
  >({
    mutationFn: async (args) => {
      const { data } = await fetcher('/troop-movements/validate', {
        method: 'POST',
        body: args,
      });

      return validateTroopMovementSchema.parse(data);
    },
  });

  return {
    validateTroopMovement,
  };
};
