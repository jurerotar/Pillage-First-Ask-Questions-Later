import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import type { ApiHandler } from '../types/handler';

const getBookmarksSchema = z
  .strictObject({
    building_id: buildingIdSchema,
    tab_name: z.string(),
  })
  .transform((t) => {
    return [t.building_id, t.tab_name];
  });

export const getBookmarks: ApiHandler<'villageId'> = (database, { params }) => {
  const { villageId } = params;

  const bookmarks = database.selectObjects(
    'SELECT building_id, tab_name FROM bookmarks WHERE village_id = $village_id;',
    {
      $village_id: villageId,
    },
  );

  return Object.fromEntries(z.array(getBookmarksSchema).parse(bookmarks));
};

export const updateBookmark: ApiHandler<
  'villageId' | 'buildingId',
  { tab: string }
> = (database, { params, body }) => {
  const { villageId, buildingId } = params;
  const { tab } = body;

  database.exec(
    `
    UPDATE bookmarks
      SET tab_name = $tab_name
      WHERE building_id = $building_id
        AND village_id = $village_id;
  `,
    {
      $tab_name: tab,
      $village_id: villageId,
      $building_id: buildingId,
    },
  );
};
