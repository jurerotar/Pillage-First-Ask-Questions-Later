import { z } from 'zod';
import {
  calculateDistanceBetweenPoints,
  roundToNDecimalPoints,
} from '@pillage-first/utils/math';

export const getArtifactsAroundVillageSchema = z
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
