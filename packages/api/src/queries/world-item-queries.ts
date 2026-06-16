export const createSelectArtifactsAroundVillageQuery = (
  artifactIds: number[],
) => `
  SELECT
    wi.item_id,
    t.x,
    t.y,
    vt.x AS vx,
    vt.y AS vy
  FROM
    world_items wi
      JOIN tiles t ON t.id = wi.tile_id
      JOIN villages v ON v.id = $village_id
      JOIN tiles vt ON vt.id = v.tile_id
  WHERE
    wi.item_id IN (${artifactIds.join(',')});
`;
