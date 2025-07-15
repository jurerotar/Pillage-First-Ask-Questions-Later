import {
  getContextualMap,
  getTileOccupiableOasis,
  getTilePlayer,
  getTileReports,
  getTileTroops,
  getTileWorldItem,
} from 'app/(game)/api/handlers/map-handlers';
import {
  getPreferences,
  updatePreference,
} from 'app/(game)/api/handlers/preferences-handlers';
import { getServer } from 'app/(game)/api/handlers/server-handlers';
import {
  getAdventurePoints,
  getHero,
} from 'app/(game)/api/handlers/hero-handlers';
import {
  deleteMultipleReports,
  deleteReport,
  getArchivedReports,
  getReportById,
  getReports,
  getReportsByVillage,
  patchMultipleReports,
  patchReport,
} from 'app/(game)/api/handlers/report-handlers';
import {
  getPlayerById,
  getPlayers,
  getTroopsByVillage,
  getVillagesByPlayer,
  renameVillage,
} from 'app/(game)/api/handlers/player-handlers';
import {
  collectQuest,
  getCollectableQuestCount,
  getQuests,
} from 'app/(game)/api/handlers/quest-handlers';
import {
  cancelConstructionEvent,
  createNewEvents,
  getVillageEvents,
  getVillageEventsByType,
} from 'app/(game)/api/handlers/event-handlers';
import { getVillageEffects } from 'app/(game)/api/handlers/effect-handlers';
import {
  getMapFilters,
  updateMapFilter,
} from 'app/(game)/api/handlers/map-filters-handlers';
import {
  getVillages,
  getVillagesBySlug,
} from 'app/(game)/api/handlers/village-handlers';
import { getReputations } from 'app/(game)/api/handlers/reputations-handlers';
import { getWorldItems } from 'app/(game)/api/handlers/world-items-handlers';
import { match } from 'path-to-regexp';
import { getResearchedUnits } from 'app/(game)/api/handlers/unit-research-handlers';
import { getUnitImprovements } from 'app/(game)/api/handlers/unit-improvement-handlers';
import {
  getBookmarks,
  updateBookmark,
} from 'app/(game)/api/handlers/bookmark-handlers';
import {
  abandonOasis,
  occupyOasis,
} from 'app/(game)/api/handlers/oasis-handlers';

// NOTE: /player/:playerId/* is aliased to /me/*. In an actual server setting you'd get current user from session

const serverRoutes = [
  {
    method: 'GET',
    path: '/server',
    handler: getServer,
  },
];

const auctionRoutes = [
  {
    method: 'GET',
    path: '/auctions',
    handler: () => {},
  },
];

const heroRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/hero',
    handler: getHero,
  },
  {
    method: 'GET',
    path: '/players/:playerId/hero/adventures',
    handler: () => {},
  },
  {
    method: 'POST',
    path: '/players/:playerId/hero/adventures/start',
    handler: () => {},
  },
  {
    method: 'GET',
    path: '/players/:playerId/hero/adventures/count',
    handler: getAdventurePoints,
  },
];

const unitResearchRoutes = [
  {
    method: 'GET',
    path: '/researched-units/:villageId',
    handler: getResearchedUnits,
  },
];

const unitImprovementRoutes = [
  {
    method: 'GET',
    path: '/unit-improvements',
    handler: getUnitImprovements,
  },
];

const reportRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/reports',
    handler: getReports,
  },
  {
    method: 'GET',
    path: '/players/:playerId/reports/archived',
    handler: getArchivedReports,
  },
  {
    method: 'GET',
    path: '/players/:playerId/reports/:villageId',
    handler: getReportsByVillage,
  },
  {
    method: 'GET',
    path: '/reports/:reportId',
    handler: getReportById,
  },
  {
    method: 'PATCH',
    path: '/reports/:reportId',
    handler: patchReport,
  },
  {
    method: 'PATCH',
    path: '/reports/bulk-tag',
    handler: patchMultipleReports,
  },
  {
    method: 'DELETE',
    path: '/reports/:reportId',
    handler: deleteReport,
  },
  {
    method: 'DELETE',
    path: '/reports/bulk-delete',
    handler: deleteMultipleReports,
  },
];

const questRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/quests',
    handler: getQuests,
  },
  {
    method: 'GET',
    path: '/players/:playerId/quests/collectables/count',
    handler: getCollectableQuestCount,
  },
  {
    method: 'PATCH',
    path: '/quests/:questId/collect',
    handler: collectQuest,
  },
];

const mapRoutes = [
  {
    method: 'GET',
    path: '/map/:villageId/contextual',
    handler: getContextualMap,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/reports',
    handler: getTileReports,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/troops',
    handler: getTileTroops,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/player',
    handler: getTilePlayer,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/world-item',
    handler: getTileWorldItem,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/occupiable-oasis',
    handler: getTileOccupiableOasis,
  },
];

const preferencesRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/preferences',
    handler: getPreferences,
  },
  {
    method: 'PATCH',
    path: '/players/:playerId/preferences/:preferenceName',
    handler: updatePreference,
  },
];

const eventRoutes = [
  {
    method: 'POST',
    path: '/events',
    handler: createNewEvents,
  },
  {
    method: 'DELETE',
    path: '/events/:eventId',
    handler: cancelConstructionEvent,
  },
];

const playerRoutes = [
  {
    method: 'GET',
    path: '/players',
    handler: getPlayers,
  },
  {
    method: 'GET',
    path: '/players/:playerId',
    handler: getPlayerById,
  },
  {
    method: 'GET',
    path: '/players/:playerId/villages',
    handler: getVillagesByPlayer,
  },
];

const villageRoutes = [
  {
    method: 'GET',
    path: '/villages',
    handler: getVillages,
  },
  {
    method: 'GET',
    path: '/villages/:villageSlug',
    handler: getVillagesBySlug,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/troops',
    handler: getTroopsByVillage,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/effects',
    handler: getVillageEffects,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/events',
    handler: getVillageEvents,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/events/:eventType',
    handler: getVillageEventsByType,
  },
  {
    method: 'PATCH',
    path: '/villages/:villageId/rename',
    handler: renameVillage,
  },
  {
    method: 'POST',
    path: '/villages/:villageId/oasis/:oasisId',
    handler: occupyOasis,
  },
  {
    method: 'DELETE',
    path: '/villages/:villageId/oasis/:oasisId',
    handler: abandonOasis,
  },
];

const mapFiltersRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/map-filters',
    handler: getMapFilters,
  },
  {
    method: 'PATCH',
    path: '/players/:playerId/map-filters/:filterName',
    handler: updateMapFilter,
  },
];

const worldItemsRoutes = [
  {
    method: 'GET',
    path: '/world-items',
    handler: getWorldItems,
  },
];

const reputationRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/reputations',
    handler: getReputations,
  },
];

const bookmarkRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/bookmarks',
    handler: getBookmarks,
  },
  {
    method: 'PATCH',
    path: '/players/:playerId/bookmarks/:buildingId',
    handler: updateBookmark,
  },
];

const apiRoutes = [
  ...serverRoutes,
  ...heroRoutes,
  ...reportRoutes,
  ...questRoutes,
  ...mapRoutes,
  ...playerRoutes,
  ...eventRoutes,
  ...villageRoutes,
  ...preferencesRoutes,
  ...mapFiltersRoutes,
  ...worldItemsRoutes,
  ...reputationRoutes,
  ...auctionRoutes,
  ...unitResearchRoutes,
  ...unitImprovementRoutes,
  ...bookmarkRoutes,
];

export const compiledApiRoutes = apiRoutes.map((route) => ({
  ...route,
  matcher: match(route.path, { decode: false }),
}));
