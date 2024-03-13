import { EffectId } from 'interfaces/models/game/effect';
import { Tribe } from 'interfaces/models/game/tribe';

export type BuildingId =
  | 'CLAY_PIT'
  | 'CROPLAND'
  | 'WOODCUTTER'
  | 'IRON_MINE'
  | 'BAKERY'
  | 'BRICKYARD'
  | 'GRAIN_MILL'
  | 'GRANARY'
  | 'GREAT_GRANARY'
  | 'GREAT_WAREHOUSE'
  | 'IRON_FOUNDRY'
  | 'SAWMILL'
  | 'WAREHOUSE'
  | 'WATERWORKS'
  | 'ACADEMY'
  | 'SMITHY'
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
  | 'STONEMASON'
  | 'TOURNAMENT_SQUARE'
  | 'TRAPPER'
  | 'WORKSHOP'
  | 'BREWERY'
  | 'COMMAND_CENTER'
  | 'CRANNY'
  | 'EMBASSY'
  | 'HORSE_DRINKING_TROUGH'
  | 'MAIN_BUILDING'
  | 'MARKETPLACE'
  | 'PALACE'
  | 'RESIDENCE'
  | 'TOWN_HALL'
  | 'TRADE_OFFICE'
  | 'TREASURY';

export type BuildingEffect = {
  effectId: EffectId;
  valuesPerLevel: number[];
};

export type BuildingLevelBuildingRequirement = {
  type: 'building';
  buildingId: Building['id'];
  level: number;
}

export type TribeBuildingRequirement = {
  type: 'tribe';
  tribe: Tribe;
}

export type AmountBuildingRequirement = {
  type: 'amount';
  amount: number;
  appliesGlobally?: true;
}

export type CapitalBuildingRequirement = {
  type: 'capital';
  canBuildOnlyInCapital: boolean;
  canBuildOnlyOutsideOfCapital: boolean;
}

export type BuildingRequirement =
  | BuildingLevelBuildingRequirement
  | TribeBuildingRequirement
  | CapitalBuildingRequirement
  | AmountBuildingRequirement;

export type BuildingCategory = 'infrastructure' | 'military' | 'resource-booster' | 'resource-production';

export type Building = {
  id: BuildingId;
  buildingDuration: number[];
  culturePointsProduction: number[];
  cropConsumption: number[];
  effects: BuildingEffect[];
  buildingRequirements: BuildingRequirement[];
  buildingCost: number[][];
  category: BuildingCategory;
};
