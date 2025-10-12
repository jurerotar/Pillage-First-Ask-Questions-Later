import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';
import { calculateDistanceBetweenPoints } from 'app/utils/common';

const getArtifactLocationSchema = z
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
      distance: calculateDistanceBetweenPoints(
        { x: t.x, y: t.y },
        { x: t.vx, y: t.vy },
      ),
    };
  });

export const getArtifactLocations: ApiHandler<
  z.infer<typeof getArtifactLocationSchema>[],
  'villageId'
> = (database, { params }) => {
  const { villageId } = params;

  const rows = database.selectObjects(
    `
      SELECT wi.item_id,
             t.x,
             t.y,
             vt.x AS vx,
             vt.y AS vy
      FROM world_items wi
             JOIN tiles t ON t.id = wi.tile_id
             JOIN villages v ON v.id = $village_id
             JOIN tiles vt ON vt.id = v.tile_id
      WHERE wi.type = 'artifact';
    `,
    { $village_id: villageId },
  );

  const listSchema = z.array(getArtifactLocationSchema);
  return listSchema.parse(rows);
};
