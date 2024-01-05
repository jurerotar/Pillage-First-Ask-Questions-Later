import { BuildingId } from 'interfaces/models/game/building';
import { Resource } from 'interfaces/models/game/resource';
import { ResourceProductionEffectId } from 'interfaces/models/game/effect';
import { invertMap } from 'utils/common';

export const resourceTypeToResourceBuildingIdMap = new Map<Resource, BuildingId>([
  ['wood', 'WOODCUTTER'],
  ['clay', 'CLAY_PIT'],
  ['iron', 'IRON_MINE'],
  ['wheat', 'CROPLAND'],
]);

export const resourceBuildingIdToResourceTypeMap = invertMap<BuildingId, Resource>(resourceTypeToResourceBuildingIdMap);

export const resourceBuildingIdToEffectIdMap = new Map<BuildingId, ResourceProductionEffectId>([
  ['WOODCUTTER', 'woodProduction'],
  ['CLAY_PIT', 'clayProduction'],
  ['IRON_MINE', 'ironProduction'],
  ['CROPLAND', 'wheatProduction'],
]);
