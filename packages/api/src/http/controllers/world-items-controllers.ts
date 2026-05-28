import { z } from 'zod';
import { artifacts } from '@pillage-first/game-assets/items';
import { mapTileWorldItemDtoSchema } from '@pillage-first/types/dtos/map';
import { createSelectArtifactsAroundVillageQuery } from '../../queries/world-item-queries';
import { createController } from '../controller';
import { mapArtifactRowToDto } from './mappers/world-items-mapper';
import { getArtifactsAroundVillageRowSchema } from './schemas/world-items-schemas';

const artifactIds = artifacts.map((item) => item.id);

export const getArtifactsAroundVillage = createController(
  '/villages/:villageId/artifacts',
  {
    summary: 'Get artifacts around village',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(mapTileWorldItemDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: createSelectArtifactsAroundVillageQuery(artifactIds),
    bind: { $village_id: villageId },
    schema: getArtifactsAroundVillageRowSchema,
  });

  return rows.map(mapArtifactRowToDto);
});
