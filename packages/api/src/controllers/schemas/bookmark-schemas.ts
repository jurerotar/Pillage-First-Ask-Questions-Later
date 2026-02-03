import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';

export const getBookmarksSchema = z
  .strictObject({
    building_id: buildingIdSchema,
    tab_name: z.string(),
  })
  .transform((t) => {
    return [t.building_id, t.tab_name];
  });
