import { artifacts } from '@pillage-first/game-assets/items';
import { createController } from '../utils/controller';
import { mapArtifactRowToDto } from './mappers/world-items-mapper';
import { getArtifactsAroundVillageRowSchema } from './schemas/world-items-schemas';

const artifactIds = artifacts.map((item) => item.id);

export const getArtifactsAroundVillage = createController(
  '/villages/:villageId/artifacts',
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: `
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
    `,
    bind: { $village_id: villageId },
    schema: getArtifactsAroundVillageRowSchema,
  });

  return rows.map(mapArtifactRowToDto);
});
