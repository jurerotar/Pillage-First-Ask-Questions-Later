import { createDocument, type ZodOpenApiPathsObject } from 'zod-openapi';
import packageJson from '../../../../package.json' with { type: 'json' };
import { developerToolsPaths } from './paths/developer-tools-paths';
import { eventPaths } from './paths/event-paths';
import { farmListPaths } from './paths/farm-list-paths';
import { heroPaths } from './paths/hero-paths';
import { historyPaths } from './paths/history-paths';
import { mapPaths } from './paths/map-paths';
import { oasisPaths } from './paths/oasis-paths';
import { playerPaths } from './paths/player-paths';
import { preferencesPaths } from './paths/preferences-paths';
import { questPaths } from './paths/quest-paths';
import { reportPaths } from './paths/report-paths';
import { reputationPaths } from './paths/reputation-paths';
import { serverPaths } from './paths/server-paths';
import { statisticsPaths } from './paths/statistics-paths';
import { troopMovementPaths } from './paths/troop-movement-paths';
import { unitPaths } from './paths/unit-paths';
import { villagePaths } from './paths/village-paths';
import { worldItemPaths } from './paths/world-item-paths';

export const paths = {
  ...serverPaths,
  ...playerPaths,
  ...villagePaths,
  ...heroPaths,
  ...developerToolsPaths,
  ...farmListPaths,
  ...eventPaths,
  ...historyPaths,
  ...mapPaths,
  ...questPaths,
  ...reputationPaths,
  ...statisticsPaths,
  ...unitPaths,
  ...worldItemPaths,
  ...oasisPaths,
  ...preferencesPaths,
  ...troopMovementPaths,
  ...reportPaths,
} satisfies ZodOpenApiPathsObject;

export const document = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Pillage First! worker-based API',
    version: packageJson.version,
    description: 'Pillage First! worker-based API',
  },
  paths,
});
