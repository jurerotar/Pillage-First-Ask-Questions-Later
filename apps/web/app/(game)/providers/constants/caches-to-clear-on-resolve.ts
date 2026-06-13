import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { GameEventType } from '@pillage-first/types/models/game-event';
import {
  adventurePointsCacheKey,
  collectableQuestCountCacheKey,
  currentVillageCacheKey,
  effectsCacheKey,
  eventsCacheKey,
  eventsHistoryCacheKey,
  heroCacheKey,
  heroInventoryCacheKey,
  loyaltyCacheKey,
  questsCacheKey,
  sentReinforcementsCacheKey,
  tilesCacheKey,
  troopMovementsCacheKey,
  unitImprovementCacheKey,
  unitResearchCacheKey,
  villageListingCacheKey,
  villageTroopsCacheKey,
} from 'app/(game)/constants/query-keys';

type HandlerFor<K extends GameEventType> = (
  event: EventApiNotificationEvent<K>,
) => unknown[][];

type Handlers = {
  [K in GameEventType]: HandlerFor<K>;
};

export const cachesToClearOnResolve: Handlers = {
  buildingScheduledConstruction: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [eventsCacheKey, 'buildingScheduledConstruction', villageId],
        [eventsCacheKey, 'buildingLevelChange', villageId],
      ]),
    ];
  },
  buildingConstruction: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [eventsCacheKey, 'buildingConstruction', villageId],
        [eventsCacheKey, 'buildingLevelChange', villageId],
      ]),
    ];
  },
  buildingLevelChange: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [effectsCacheKey, villageId],
        [questsCacheKey, villageId],
        [collectableQuestCountCacheKey, villageId],
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'buildingLevelChange', villageId],
      ]),
    ];
  },
  buildingDestruction: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [effectsCacheKey, villageId],
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'buildingDestruction', villageId],
      ]),
    ];
  },
  troopTraining: ({ affectedVillageIds }) => {
    return [
      ...affectedVillageIds.map((villageId) => [
        [villageTroopsCacheKey, villageId],
        [effectsCacheKey, villageId],
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'troopTraining', villageId],
      ]),
    ];
  },
  troopMovementReinforcements: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [villageTroopsCacheKey, villageId],
        [effectsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
        [sentReinforcementsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementRelocation: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [villageTroopsCacheKey, villageId],
        [effectsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementReturn: ({ affectedVillageIds }) => {
    return [
      [heroCacheKey],
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [villageTroopsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementFindNewVillage: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [villageListingCacheKey],
      [tilesCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [effectsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementAttack: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [effectsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementRaid: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [effectsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
      ]),
    ];
  },
  // TODO: Update query keys here
  troopMovementOasisOccupation: ({ affectedVillageIds }) => {
    return [
      [heroCacheKey],
      [tilesCacheKey],
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [effectsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementAdventure: ({ affectedVillageIds }) => {
    return [
      [heroCacheKey],
      [adventurePointsCacheKey],
      [heroInventoryCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [questsCacheKey, villageId],
        [effectsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
      ]),
    ];
  },
  unitResearch: ({ affectedVillageIds }) => {
    return [
      ...affectedVillageIds.map((villageId) => [
        [unitResearchCacheKey, villageId],
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'unitResearch', villageId],
      ]),
    ];
  },
  unitImprovement: ({ affectedVillageIds }) => {
    return [
      [unitImprovementCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'unitImprovement', villageId],
      ]),
    ];
  },
  animalCageProduction: ({ affectedVillageIds }) => {
    return [
      [heroInventoryCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [eventsCacheKey, 'animalCageProduction', villageId],
        [eventsHistoryCacheKey, villageId],
      ]),
    ];
  },
  huntersLodgeHunt: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [villageTroopsCacheKey, villageId],
        [eventsCacheKey, 'huntersLodgeHunt', villageId],
      ]),
    ];
  },
  heroRevival: ({ affectedVillageIds }) => {
    return [
      [heroCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [effectsCacheKey, villageId],
        [eventsCacheKey, 'heroRevival', villageId],
        [villageTroopsCacheKey, villageId],
      ]),
    ];
  },
  heroHealthRegeneration: () => {
    return [[heroCacheKey]];
  },
  loyaltyIncrease: ({ affectedVillageIds }) => {
    return [
      ...affectedVillageIds.map((villageId) => [[loyaltyCacheKey, villageId]]),
    ];
  },
  gatherersHutGatheringTrip: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.map((villageId) => [
        [villageTroopsCacheKey, villageId],
        [eventsCacheKey, 'gatherersHutGatheringTrip', villageId],
      ]),
    ];
  },
};
