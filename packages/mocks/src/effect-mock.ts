import type {
  ArtifactEffect,
  HeroEffect,
  OasisEffect,
  ServerEffect,
  VillageBuildingEffect,
} from '@pillage-first/types/models/effect';
import { villageMock } from './village-mock';

const tileId = villageMock.tileId;

export const woodProductionBaseEffectMock: VillageBuildingEffect = {
  tileId,
  scope: 'local',
  source: 'building',
  value: 100,
  id: 'woodProduction',
  sourceSpecifier: 1,
  buildingId: 'WOODCUTTER',
  type: 'base',
};

export const woodProductionBonusEffectMock: VillageBuildingEffect = {
  tileId,
  scope: 'local',
  source: 'building',
  value: 1.25,
  id: 'woodProduction',
  sourceSpecifier: 30,
  buildingId: 'SAWMILL',
  type: 'bonus',
};

export const woodProductionBonusBoosterEffectMock: VillageBuildingEffect = {
  tileId,
  scope: 'local',
  source: 'building',
  value: 2,
  id: 'woodProduction',
  sourceSpecifier: 30,
  buildingId: 'SAWMILL',
  type: 'bonus-booster',
};

export const woodProductionServerEffectMock: ServerEffect = {
  id: 'woodProduction',
  scope: 'server',
  source: 'server',
  value: 2,
  type: 'base',
  sourceSpecifier: null,
};

export const woodProductionHeroBaseEffectMock: HeroEffect = {
  tileId,
  id: 'woodProduction',
  scope: 'local',
  source: 'hero',
  value: 10,
  type: 'base',
  sourceSpecifier: null,
};

export const woodProductionHeroBonusEffectMock: HeroEffect = {
  tileId,
  id: 'woodProduction',
  scope: 'local',
  source: 'hero',
  value: 2,
  type: 'bonus',
  sourceSpecifier: null,
};

export const woodProductionArtifactEffectMock: ArtifactEffect = {
  tileId,
  id: 'woodProduction',
  scope: 'local',
  source: 'artifact',
  value: 1.1,
  type: 'bonus',
  sourceSpecifier: null,
};

export const woodProductionOasisEffectMock: OasisEffect = {
  tileId,
  id: 'woodProduction',
  scope: 'local',
  source: 'oasis',
  value: 1.25,
  type: 'bonus',
  sourceSpecifier: null,
};

export const wheatProductionBaseEffectMock: VillageBuildingEffect = {
  tileId,
  scope: 'local',
  source: 'building',
  value: 100,
  id: 'wheatProduction',
  sourceSpecifier: 1,
  buildingId: 'WHEAT_FIELD',
  type: 'base',
};

export const wheatProductionBonusEffectMock: VillageBuildingEffect = {
  tileId,
  scope: 'local',
  source: 'building',
  value: 1.25,
  id: 'wheatProduction',
  sourceSpecifier: 30,
  buildingId: 'GRAIN_MILL',
  type: 'bonus',
};

export const wheatProductionBonusBoosterEffectMock: VillageBuildingEffect = {
  tileId,
  scope: 'local',
  source: 'building',
  value: 2,
  id: 'wheatProduction',
  sourceSpecifier: 30,
  buildingId: 'SAWMILL',
  type: 'bonus-booster',
};

export const wheatProductionHeroBaseEffectMock: HeroEffect = {
  tileId,
  id: 'wheatProduction',
  scope: 'local',
  source: 'hero',
  value: 10,
  type: 'base',
  sourceSpecifier: null,
};

export const wheatProductionHeroBonusEffectMock: HeroEffect = {
  tileId,
  id: 'wheatProduction',
  scope: 'local',
  source: 'hero',
  value: 2,
  type: 'bonus',
  sourceSpecifier: null,
};

export const wheatProductionServerEffectMock: ServerEffect = {
  id: 'wheatProduction',
  scope: 'server',
  source: 'server',
  value: 2,
  type: 'bonus',
  sourceSpecifier: null,
};

export const unitSpeedHeroBonusEffectMock: HeroEffect = {
  tileId,
  id: 'unitSpeed',
  scope: 'local',
  source: 'hero',
  value: 2,
  type: 'bonus',
  sourceSpecifier: null,
};

export const unitSpeedAfter20FieldsHeroBonusEffectMock: HeroEffect = {
  tileId,
  id: 'unitSpeedAfter20Fields',
  scope: 'local',
  source: 'hero',
  value: 2,
  type: 'bonus',
  sourceSpecifier: null,
};

export const unitSpeedAfter20FieldsHugeHeroBonusEffectMock: HeroEffect = {
  tileId,
  id: 'unitSpeedAfter20Fields',
  scope: 'local',
  source: 'hero',
  value: 10,
  type: 'bonus',
  sourceSpecifier: null,
};
