import { buildingIdSchema } from 'app/interfaces/models/game/building';
import { z } from 'zod';

export const buildingFieldSchema = z.strictObject({
  // Resource building ids [1, 18]
  // Village building ids [19, 40]
  // Rally point (39) and wall (40) are always on the same spot, these spots can't be taken by other buildings, nor can a player build anything else here
  id: z.number(),
  buildingId: buildingIdSchema,
  level: z.number(),
});

export type BuildingField = z.infer<typeof buildingFieldSchema>;
