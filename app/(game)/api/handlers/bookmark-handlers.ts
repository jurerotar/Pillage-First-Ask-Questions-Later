import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';
import type { Bookmarks } from 'app/interfaces/models/game/bookmark';
import type { Building } from 'app/interfaces/models/game/building';

const getBookmarksSchema = z
  .strictObject({
    building_id: z.string().brand<Building['id']>(),
    tab_name: z.string(),
  })
  .transform((t) => {
    return [t.building_id, t.tab_name];
  });

export const getBookmarks: ApiHandler<Bookmarks, 'villageId'> = async (
  _queryClient,
  database,
  { params },
) => {
  const { villageId } = params;

  const bookmarks = database.selectObjects(
    'SELECT building_id, tab_name FROM bookmarks WHERE village_id = $village_id;',
    {
      $village_id: villageId,
    },
  );

  const listSchema = z.array(getBookmarksSchema);

  return Object.fromEntries(listSchema.parse(bookmarks));
};

export const updateBookmark: ApiHandler<
  void,
  'villageId' | 'buildingId',
  { tab: string }
> = async (_queryClient, database, { params, body }) => {
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
