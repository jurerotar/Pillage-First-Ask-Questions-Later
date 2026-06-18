export const selectVillageBookmarksQuery = `
  SELECT bi.building AS building_id, b.tab_name
  FROM
    bookmarks b
      JOIN building_ids bi ON bi.id = b.building_id
  WHERE
    b.village_id = $village_id;
`;

export const updateVillageBookmarkTabQuery = `
  UPDATE bookmarks
  SET
    tab_name = $tab_name
  WHERE
    building_id = (
      SELECT id
      FROM
        building_ids
      WHERE
        building = $building_id
    )
    AND village_id = $village_id;
`;
