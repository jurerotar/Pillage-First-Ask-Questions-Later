export const serverCacheKey = 'server';
export const developerModeCacheKey = 'developer-mode';
export const effectsCacheKey = 'effects';
export const heroCacheKey = 'hero';
export const mapCacheKey = 'map';
export const playersCacheKey = 'players';
export const preferencesCacheKey = 'preferences';
export const questsCacheKey = 'quests';
export const reportsCacheKey = 'reports';
export const reputationsCacheKey = 'reputations';
export const troopsCacheKey = 'units';
export const unitImprovementCacheKey = 'unit-improvement';
export const unitResearchCacheKey = 'unit-research';
export const villagesCacheKey = 'villages';
export const playerVillagesCacheKey = 'player-villages';
export const mapFiltersCacheKey = 'map-filters';
export const eventsCacheKey = 'events';
export const mapMarkersCacheKey = 'map-markers';
export const worldItemsCacheKey = 'world-items';
export const adventurePointsCacheKey = 'adventure-points';

// Add the following key to a query to mark it as non-persistent. These queries are not persisted to OPFS and are meant for performance
// optimizations reasons only. Use them to cache commonly accessed values to prevent recalculations.
export const nonPersistedCacheKey = 'non-persisted';
