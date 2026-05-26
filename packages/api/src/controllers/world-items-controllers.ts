import { artifacts } from '@pillage-first/game-assets/items';
import { createSelectArtifactsAroundVillageQuery } from '../queries/world-item-queries';
import { createController } from '../utils/controller';
import { mapArtifactRowToDto } from './mappers/world-items-mapper';
import { getArtifactsAroundVillageRowSchema } from './schemas/world-items-schemas';

const artifactIds = artifacts.map((item) => item.id);

export const getArtifactsAroundVillage = createController(
  '/villages/:villageId/artifacts',
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: createSelectArtifactsAroundVillageQuery(artifactIds),
    bind: { $village_id: villageId },
    schema: getArtifactsAroundVillageRowSchema,
  });

  return rows.map(mapArtifactRowToDto);
});
