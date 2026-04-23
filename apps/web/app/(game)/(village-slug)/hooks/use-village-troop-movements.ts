import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { troopMovementsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

const troopMovementSchema = z.union([
  z.strictObject({
    id: z.number(),
    type: z.literal('troopMovementAdventure'),
    originatingVillageId: z.number(),
    originatingVillageName: z.string(),
    originatingVillageCoordinates: coordinatesSchema,
    playerName: z.string(),
    playerId: z.number(),
    playerTribe: tribeSchema,
    resolvesAt: z.number(),
  }),
  z.strictObject({
    id: z.number(),
    type: z.string(),
    originatingVillageId: z.number(),
    originatingVillageName: z.string(),
    originatingVillageCoordinates: coordinatesSchema,
    playerName: z.string(),
    playerId: z.number(),
    playerTribe: tribeSchema,
    resolvesAt: z.number(),
    targetVillageId: z.number().nullable(),
    targetVillageName: z.string().nullable(),
    targetVillageCoordinates: coordinatesSchema.nullable(),
  }),
]);

export const useVillageTroopMovements = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: troopMovements } = useSuspenseQuery({
    queryKey: [troopMovementsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher(
        `/villages/${currentVillage.id}/troop-movements`,
      );

      return z.array(troopMovementSchema).parse(data);
    },
  });

  return {
    troopMovements,
  };
};
