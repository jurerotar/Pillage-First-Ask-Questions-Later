import type { QueryKey } from '@tanstack/react-query';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { GameEventType } from '@pillage-first/types/models/game-event';
import {
  adventurePointsCacheKey,
  collectableQuestCountCacheKey,
  currentVillageCacheKey,
  effectsCacheKey,
  eventsCacheKey,
  eventsHistoryCacheKey,
  gatherersHutExpeditionsCacheKey,
  heroCacheKey,
  heroInventoryCacheKey,
  loyaltyCacheKey,
  occupiableOasisInRangeCacheKey,
  questsCacheKey,
  reportsCacheKey,
  sentReinforcementsCacheKey,
  tilesCacheKey,
  trapperCagesCacheKey,
  troopMovementsCacheKey,
  unitImprovementCacheKey,
  unitResearchCacheKey,
  villageListingCacheKey,
  villageTroopsCacheKey,
} from 'app/(game)/constants/query-keys';

type HandlerFor<K extends GameEventType> = (
  event: EventApiNotificationEvent<K>,
) => QueryKey[];

type Handlers = {
  [K in GameEventType]: HandlerFor<K>;
};

export const cachesToClearOnResolve: Handlers = {
  buildingScheduledConstruction: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'buildingScheduledConstruction', villageId],
        [eventsCacheKey, 'buildingLevelChange', villageId],
      ]),
    ];
  },
  buildingConstruction: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'buildingConstruction', villageId],
        [eventsCacheKey, 'buildingLevelChange', villageId],
      ]),
    ];
  },
  buildingLevelChange: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
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
      ...affectedVillageIds.flatMap((villageId) => [
        [effectsCacheKey, villageId],
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'buildingDestruction', villageId],
      ]),
    ];
  },
  troopTraining: ({ affectedVillageIds }) => {
    return [
      ...affectedVillageIds.flatMap((villageId) => [
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
      ...affectedVillageIds.flatMap((villageId) => [
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
      ...affectedVillageIds.flatMap((villageId) => [
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
      ...affectedVillageIds.flatMap((villageId) => [
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
      ...affectedVillageIds.flatMap((villageId) => [
        [effectsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementAttack: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [reportsCacheKey],
      [loyaltyCacheKey],
      [tilesCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [effectsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
        [villageTroopsCacheKey, villageId],
        [occupiableOasisInRangeCacheKey, villageId],
        [effectsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementRaid: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [reportsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [effectsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
        [villageTroopsCacheKey, villageId],
        [effectsCacheKey, villageId],
      ]),
    ];
  },
  // TODO: Update query keys here
  troopMovementOasisOccupation: ({ affectedVillageIds }) => {
    return [
      [heroCacheKey],
      [tilesCacheKey],
      [currentVillageCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
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
      ...affectedVillageIds.flatMap((villageId) => [
        [questsCacheKey, villageId],
        [effectsCacheKey, villageId],
        [troopMovementsCacheKey, villageId],
      ]),
    ];
  },
  unitResearch: ({ affectedVillageIds }) => {
    return [
      ...affectedVillageIds.flatMap((villageId) => [
        [unitResearchCacheKey, villageId],
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'unitResearch', villageId],
      ]),
    ];
  },
  unitImprovement: ({ affectedVillageIds }) => {
    return [
      [unitImprovementCacheKey],
      [eventsCacheKey, 'unitImprovement'],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsHistoryCacheKey, villageId],
      ]),
    ];
  },
  animalCageProduction: ({ affectedVillageIds }) => {
    return [
      [heroInventoryCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'animalCageProduction', villageId],
        [eventsHistoryCacheKey, villageId],
      ]),
    ];
  },
  trapperCageProduction: ({ affectedVillageIds }) => {
    return [
      ...affectedVillageIds.flatMap((villageId) => [
        [trapperCagesCacheKey, villageId],
        [eventsCacheKey, 'trapperCageProduction', villageId],
        [eventsHistoryCacheKey, villageId],
      ]),
    ];
  },
  huntersLodgeHunt: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [villageTroopsCacheKey, villageId],
        [eventsCacheKey, 'huntersLodgeHunt', villageId],
      ]),
    ];
  },
  heroRevival: ({ affectedVillageIds }) => {
    return [
      [heroCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
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
      ...affectedVillageIds.map((villageId) => [loyaltyCacheKey, villageId]),
    ];
  },
  gatherersHutGatheringTrip: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [villageTroopsCacheKey, villageId],
        [eventsCacheKey, 'gatherersHutGatheringTrip', villageId],
        [gatherersHutExpeditionsCacheKey, villageId],
      ]),
    ];
  },
  resourceTransfer: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'resourceTransfer', villageId],
      ]),
    ];
  },
  tradeRoute: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'resourceTransfer', villageId],
        [eventsCacheKey, 'tradeRoute', villageId],
      ]),
    ];
  },
};
