import { z } from 'zod';
import { buildingIdSchema } from './building';

// Some fields are special and cannot be destroyed, because they must exist on a specific field: all resource fields, rally point & wall.
export const specialFieldIds: BuildingField['id'][] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 39, 40,
];

export const buildingFieldSchema = z
  .strictObject({
    // Resource building ids [1, 18]
    // Village building ids [19, 40]
    // Rally point (39) and wall (40) are always on the same spot, these spots can't be taken by other buildings, nor can a player build anything else here
    id: z.number(),
    buildingId: buildingIdSchema,
    level: z.number(),
  })
  .meta({ id: 'BuildingField' });

export type BuildingField = z.infer<typeof buildingFieldSchema>;
