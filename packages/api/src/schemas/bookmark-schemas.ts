import { z } from 'zod';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';

export const getBookmarksSchema = z
  .strictObject({
    building_id: buildingIdSchema,
    tab_name: z.string(),
  })
  .transform<[Building['id'], string]>((t) => {
    return [t.building_id, t.tab_name];
  })
  .meta({ id: 'GetBookmarks' });
