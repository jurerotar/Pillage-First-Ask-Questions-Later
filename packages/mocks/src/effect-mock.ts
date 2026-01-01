import type {
  ArtifactEffect,
  HeroEffect,
  OasisEffect,
  ServerEffect,
  VillageBuildingEffect,
} from '@pillage-first/types/models/effect';
import { villageMock } from './village-mock';

const villageId = villageMock.id;

export const woodProductionBaseEffectMock: VillageBuildingEffect = {
  villageId,
  scope: 'village',
  source: 'building',
  value: 100,
  id: 'woodProduction',
  sourceSpecifier: 1,
  buildingId: 'WOODCUTTER',
  type: 'base',
};

export const woodProductionBonusEffectMock: VillageBuildingEffect = {
  villageId,
  scope: 'village',
  source: 'building',
  value: 1.25,
  id: 'woodProduction',
  sourceSpecifier: 30,
  buildingId: 'SAWMILL',
  type: 'bonus',
};

export const woodProductionBonusBoosterEffectMock: VillageBuildingEffect = {
  villageId,
  scope: 'village',
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
  villageId,
  id: 'woodProduction',
  scope: 'village',
  source: 'hero',
  value: 10,
  type: 'base',
  sourceSpecifier: null,
};

export const woodProductionHeroBonusEffectMock: HeroEffect = {
  villageId,
  id: 'woodProduction',
  scope: 'village',
  source: 'hero',
  value: 2,
  type: 'bonus',
  sourceSpecifier: null,
};

export const woodProductionArtifactEffectMock: ArtifactEffect = {
  villageId,
  id: 'woodProduction',
  scope: 'village',
  source: 'artifact',
  value: 1.1,
  type: 'bonus',
  sourceSpecifier: null,
};

export const woodProductionOasisEffectMock: OasisEffect = {
  villageId,
  id: 'woodProduction',
  scope: 'village',
  source: 'oasis',
  value: 1.25,
  type: 'bonus',
  sourceSpecifier: null,
};

export const wheatProductionBaseEffectMock: VillageBuildingEffect = {
  villageId,
  scope: 'village',
  source: 'building',
  value: 100,
  id: 'wheatProduction',
  sourceSpecifier: 1,
  buildingId: 'WHEAT_FIELD',
  type: 'base',
};

export const wheatProductionBonusEffectMock: VillageBuildingEffect = {
  villageId,
  scope: 'village',
  source: 'building',
  value: 1.25,
  id: 'wheatProduction',
  sourceSpecifier: 30,
  buildingId: 'GRAIN_MILL',
  type: 'bonus',
};

export const wheatProductionBonusBoosterEffectMock: VillageBuildingEffect = {
  villageId,
  scope: 'village',
  source: 'building',
  value: 2,
  id: 'wheatProduction',
  sourceSpecifier: 30,
  buildingId: 'SAWMILL',
  type: 'bonus-booster',
};

export const wheatProductionHeroBaseEffectMock: HeroEffect = {
  villageId,
  id: 'wheatProduction',
  scope: 'village',
  source: 'hero',
  value: 10,
  type: 'base',
  sourceSpecifier: null,
};

export const wheatProductionHeroBonusEffectMock: HeroEffect = {
  villageId,
  id: 'wheatProduction',
  scope: 'village',
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
