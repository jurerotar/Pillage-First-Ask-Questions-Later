import type { Effect } from 'app/interfaces/models/game/effect';
import type { Tribe } from 'app/interfaces/models/game/tribe';

export type BuildingId =
  | 'CLAY_PIT'
  | 'WHEAT_FIELD'
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
  | 'TRADE_OFFICE'
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

export type ArtifactBuildingRequirement = {
  id: number;
  type: 'artifact';
};

export type BuildingRequirement =
  | ArtifactBuildingRequirement
  | BuildingLevelBuildingRequirement
  | TribeBuildingRequirement
  | CapitalBuildingRequirement
  | AmountBuildingRequirement;

export type BuildingCategory = 'infrastructure' | 'military' | 'resource-booster' | 'resource-production';

export type Building = {
  id: BuildingId;
  buildingDurationBase: number;
  buildingDurationModifier: number;
  buildingDurationReduction: number;
  effects: BuildingEffect[];
  buildingRequirements: BuildingRequirement[];
  baseBuildingCost: number[];
  category: BuildingCategory;
  buildingCostCoefficient: number;
  maxLevel: number;
};
