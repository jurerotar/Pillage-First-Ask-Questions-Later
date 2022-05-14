export type BuildingIds =
  'BAKERY'
  | 'BRICKYARD'
  | 'CLAY_PIT'
  | 'CROPLAND'
  | 'GRAIN_MILL'
  | 'GRANARY'
  | 'GREAT_GRANARY'
  | 'GREAT_WAREHOUSE'
  | 'IRON_FOUNDRY'
  | 'IRON_MINE'
  | 'SAWMILL'
  | 'WAREHOUSE'
  | 'WATERWORKS'
  | 'WOODCUTTER'
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
  | 'WATCHTOWER'
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
  | 'TREASURY'
  | 'WONDER_OF_THE_WORLD';

export type Building = {
  name: BuildingIds;
  maxLevel: number;
  buildingCostModifier: [number, number, number, number];
  buildingTimeModifier: number;
  cropConsumptionPerLevel: number[];
  culturePointsGenerationPerLevel: number[];
};
