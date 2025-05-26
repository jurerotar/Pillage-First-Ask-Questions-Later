import { getMap } from 'app/(game)/api/handlers/map-handlers';
import { getPreferences, updatePreference } from 'app/(game)/api/handlers/preferences-handlers';
import { getServer } from 'app/(game)/api/handlers/server-handlers';
import { getAdventurePoints, getHero } from 'app/(game)/api/handlers/hero-handlers';
import { getReports } from 'app/(game)/api/handlers/report-handlers';
import {
  getPlayerById,
  getPlayers,
  getTroopMovementsByVillage,
  getTroopsByVillage,
  getVillagesByPlayer,
} from 'app/(game)/api/handlers/player-handlers';
import { collectQuest, getCollectableQuestCount, getQuests } from 'app/(game)/api/handlers/quest-handlers';
import { cancelConstructionEvent, createNewEvents, getEvents } from 'app/(game)/api/handlers/event-handlers';
import { getEffects } from 'app/(game)/api/handlers/effect-handlers';
import { getDeveloperMode, toggleDeveloperMode } from 'app/(game)/api/handlers/developer-mode-handlers';
import { getMapFilters, updateMapFilter } from 'app/(game)/api/handlers/map-filters-handlers';
import { getVillages } from 'app/(game)/api/handlers/village-handlers';
import { getReputations } from 'app/(game)/api/handlers/reputations-handlers';
import { getWorldItems } from 'app/(game)/api/handlers/world-items-handlers';
import { getTroops } from 'app/(game)/api/handlers/troop-handlers';

const serverRoutes = [
  {
    method: 'GET',
    path: '/server',
    handler: getServer,
  },
];

const heroRoutes = [
  {
    method: 'GET',
    path: '/hero',
    handler: getHero,
  },
  {
    method: 'GET',
    path: '/hero/adventures',
    handler: () => {},
  },
  {
    method: 'GET',
    path: '/hero/adventures/count',
    handler: getAdventurePoints,
  },
  {
    method: 'GET',
    path: '/hero/auctions',
    handler: () => {},
  },
];

const reportRoutes = [
  {
    method: 'GET',
    path: '/reports',
    handler: getReports,
  },
  {
    method: 'GET',
    path: '/reports/:reportId',
    handler: () => {},
  },
  {
    method: 'PATCH',
    path: '/reports/:reportId/read',
    handler: () => {},
  },
  {
    method: 'PATCH',
    path: '/reports/:reportId/archive',
    handler: () => {},
  },
  {
    method: 'DELETE',
    path: '/reports/:reportId/delete',
    handler: () => {},
  },
];

const questRoutes = [
  {
    method: 'GET',
    path: '/quests',
    handler: getQuests,
  },
  {
    method: 'GET',
    path: '/quests/collectables/count',
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
    path: '/map',
    handler: getMap,
  },
  {
    method: 'GET',
    path: '/map/optimized',
    handler: () => {},
  },
];

const settingsRoutes = [
  {
    method: 'GET',
    path: '/settings/preferences',
    handler: getPreferences,
  },
  {
    method: 'PATCH',
    path: '/settings/preferences',
    handler: updatePreference,
  },
  {
    method: 'GET',
    path: '/settings/developer-mode',
    handler: getDeveloperMode,
  },

  {
    method: 'PATCH',
    path: '/settings/developer-mode',
    handler: toggleDeveloperMode,
  },
];

const eventRoutes = [
  {
    method: 'GET',
    path: '/events',
    handler: getEvents,
  },
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

const effectRoutes = [
  {
    method: 'GET',
    path: '/effects',
    handler: getEffects,
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
  {
    method: 'PATCH',
    path: '/players/:playerId/villages/:villageId/rename',
    handler: () => {},
  },
  {
    method: 'GET',
    path: '/players/:playerId/villages/:villageId/troops',
    handler: getTroopsByVillage,
  },
  {
    method: 'GET',
    path: '/players/:playerId/villages/:villageId/troop-movements',
    handler: getTroopMovementsByVillage,
  },
];

const villageRoutes = [
  {
    method: 'GET',
    path: '/villages',
    handler: getVillages,
  },
];

const mapFiltersRoutes = [
  {
    method: 'GET',
    path: '/map-filters',
    handler: getMapFilters,
  },
  {
    method: 'PATCH',
    path: '/map-filters',
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
    path: '/reputations',
    handler: getReputations,
  },
];

const troopRoutes = [
  {
    method: 'GET',
    path: '/troops',
    handler: getTroops,
  },
];

export const apiRoutes = [
  ...serverRoutes,
  ...heroRoutes,
  ...reportRoutes,
  ...questRoutes,
  ...mapRoutes,
  ...playerRoutes,
  ...eventRoutes,
  ...effectRoutes,
  ...villageRoutes,
  ...settingsRoutes,
  ...mapFiltersRoutes,
  ...worldItemsRoutes,
  ...reputationRoutes,
  ...troopRoutes,
];
