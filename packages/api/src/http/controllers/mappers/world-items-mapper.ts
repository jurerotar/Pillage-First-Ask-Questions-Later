import type { z } from 'zod';
import { mapTileWorldItemDtoSchema } from '@pillage-first/types/dtos/map';
import {
  calculateDistanceBetweenPoints,
  roundToNDecimalPoints,
} from '@pillage-first/utils/math';
import type { getArtifactsAroundVillageRowSchema } from '../schemas/world-items-schemas';

export const mapArtifactRowToDto = (
  row: z.infer<typeof getArtifactsAroundVillageRowSchema>,
) =>
  mapTileWorldItemDtoSchema.parse({
    id: row.item_id,
    coordinates: { x: row.x, y: row.y },
    distance: roundToNDecimalPoints(
      calculateDistanceBetweenPoints(
        { x: row.x, y: row.y },
        { x: row.vx, y: row.vy },
      ),
      2,
    ),
    // Artifacts are unique world items on a tile, represented with count 1
    amount: 1,
  });
