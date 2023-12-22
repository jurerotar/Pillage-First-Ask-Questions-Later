import { ResourceBuildingId } from 'interfaces/models/game/building';
import { Resource } from 'interfaces/models/game/resource';
import { ResourceProductionEffectId } from 'interfaces/models/game/effect';

export const resourceTypeToResourceBuildingIdMap = new Map<Resource, ResourceBuildingId>([
  ['wood', 'WOODCUTTER'],
  ['clay', 'CLAY_PIT'],
  ['iron', 'IRON_MINE'],
  ['wheat', 'CROPLAND'],
]);

export const resourceBuildingIdToEffectIdMap = new Map<ResourceBuildingId, ResourceProductionEffectId>([
  ['WOODCUTTER', 'woodProduction'],
  ['CLAY_PIT', 'clayProduction'],
  ['IRON_MINE', 'ironProduction'],
  ['CROPLAND', 'wheatProduction'],
]);
