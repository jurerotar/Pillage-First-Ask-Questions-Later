import { z } from 'zod';
import type { Effect } from './effect';
import type { Tribe } from './tribe';

export type TroopTrainingBuildingId =
  | 'BARRACKS'
  | 'GREAT_BARRACKS'
  | 'STABLE'
  | 'GREAT_STABLE'
  | 'WORKSHOP'
  | 'HOSPITAL';

type BuildingId =
  | TroopTrainingBuildingId
  | 'CLAY_PIT'
  | 'WHEAT_FIELD'
  | 'WOODCUTTER'
  | 'IRON_MINE'
  | 'BAKERY'
  | 'BRICKYARD'
  | 'GRAIN_MILL'
  | 'GRANARY'
  | 'GREAT_GRANARY'
  | 'IRON_FOUNDRY'
  | 'SAWMILL'
  | 'WAREHOUSE'
  | 'GREAT_WAREHOUSE'
  | 'WATERWORKS'
  | 'ACADEMY'
  | 'CITY_WALL'
  | 'EARTH_WALL'
  | 'HEROS_MANSION'
  | 'MAKESHIFT_WALL'
  | 'PALISADE'
  | 'RALLY_POINT'
  | 'STONE_WALL'
  | 'TRAPPER'
  | 'WORKSHOP'
  | 'BREWERY'
  | 'COMMAND_CENTER'
  | 'CRANNY'
  | 'HORSE_DRINKING_TROUGH'
  | 'MAIN_BUILDING'
  | 'MARKETPLACE'
  | 'RESIDENCE'
  | 'TOURNAMENT_SQUARE'
  | 'TRADE_OFFICE'
  | 'SMITHY'
  | 'TOWN_HALL'
  | 'EMBASSY'
  | 'TREASURY';

export type BuildingEffect = {
  effectId: Effect['id'];
  valuesPerLevel: number[];
  type: Effect['type'];
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
};

export type BuildingRequirement =
  | BuildingLevelBuildingRequirement
  | TribeBuildingRequirement
  | AmountBuildingRequirement;

type BuildingCategory =
  | 'infrastructure'
  | 'military'
  | 'resource-booster'
  | 'resource-production';

export type Building = {
  id: BuildingId;
  populationCoefficient: number;
  culturePointsCoefficient: number;
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

export const buildingIdSchema = z.string().pipe(z.custom<BuildingId>());
