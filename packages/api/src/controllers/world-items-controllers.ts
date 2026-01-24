import { z } from 'zod';
import { artifacts } from '@pillage-first/game-assets/items';
import {
  calculateDistanceBetweenPoints,
  roundToNDecimalPoints,
} from '@pillage-first/utils/math';
import type { Controller } from '../types/controller';

const getArtifactsAroundVillageSchema = z
  .strictObject({
    item_id: z.number(),
    x: z.number(),
    y: z.number(),
    vx: z.number(),
    vy: z.number(),
  })
  .transform((t) => {
    return {
      id: t.item_id,
      coordinates: {
        x: t.x,
        y: t.y,
      },
      distance: roundToNDecimalPoints(
        calculateDistanceBetweenPoints(
          { x: t.x, y: t.y },
          { x: t.vx, y: t.vy },
        ),
        2,
      ),
    };
  });

const artifactIds = artifacts.map((item) => item.id);

/**
 * GET /villages/:villageId/artifacts
 * @pathParam {number} villageId
 */
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
