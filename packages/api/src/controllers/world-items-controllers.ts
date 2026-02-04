import { artifacts } from '@pillage-first/game-assets/items';
import type { Controller } from '../types/controller';
import { getArtifactsAroundVillageSchema } from './schemas/world-items-schemas';

const artifactIds = artifacts.map((item) => item.id);

export const getArtifactsAroundVillage: Controller<
  '/villages/:villageId/artifacts'
> = (database, { params }) => {
  const { villageId } = params;

  return database.selectObjects({
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
    schema: getArtifactsAroundVillageSchema,
  });
};
