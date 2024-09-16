import type { Effect } from 'interfaces/models/game/effect';
import type { Tribe } from 'interfaces/models/game/tribe';

export type BuildingId =
  | 'CLAY_PIT'
  | 'CROPLAND'
  | 'WOODCUTTER'
  | 'IRON_MINE'
  | 'BAKERY'
  | 'BRICKYARD'
  | 'GRAIN_MILL'
  | 'GRANARY'
  | 'IRON_FOUNDRY'
  | 'SAWMILL'
  | 'WAREHOUSE'
  | 'WATERWORKS'
  | 'ACADEMY'
  | 'BARRACKS'
  | 'CITY_WALL'
  | 'EARTH_WALL'
  | 'GREAT_BARRACKS'
  | 'GREAT_STABLE'
  | 'HEROS_MANSION'
  | 'HOSPITAL'
  | 'MAKESHIFT_WALL'
  | 'PALISADE'
  | 'RALLY_POINT'
  | 'STABLE'
  | 'STONE_WALL'
  | 'TRAPPER'
  | 'WORKSHOP'
  | 'BREWERY'
  | 'COMMAND_CENTER'
  | 'CRANNY'
  | 'HORSE_DRINKING_TROUGH'
  | 'MAIN_BUILDING'
  | 'MARKETPLACE'
  | 'PALACE'
  | 'RESIDENCE'
  | 'TOURNAMENT_SQUARE'
  | 'TREASURY';

export type BuildingEffect = {
  effectId: Effect['id'];
  valuesPerLevel: number[];
};

export type BuildingLevelBuildingRequirement = {
  id: number;
  type: 'building';
  buildingId: Building['id'];
  level: number;
};

export type TribeBuildingRequirement = {
  id: number;
  type: 'tribe';
  tribe: Tribe;
};

export type AmountBuildingRequirement = {
  id: number;
  type: 'amount';
  amount: number;
  appliesGlobally?: true;
};

export type CapitalBuildingRequirement = {
  id: number;
  type: 'capital';
  canBuildOnlyInCapital: boolean;
  canBuildOnlyOutsideOfCapital: boolean;
};

export type BuildingRequirement =
  | BuildingLevelBuildingRequirement
  | TribeBuildingRequirement
  | CapitalBuildingRequirement
  | AmountBuildingRequirement;

export type BuildingCategory = 'infrastructure' | 'military' | 'resource-booster' | 'resource-production';

export type Building = {
  id: BuildingId;
  buildingDuration: number[];
  cropConsumption: number[];
  effects: BuildingEffect[];
  buildingRequirements: BuildingRequirement[];
  buildingCost: number[][];
  category: BuildingCategory;
};
