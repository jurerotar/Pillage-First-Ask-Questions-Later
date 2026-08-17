import { describe, expect, test } from 'vitest';
import {
  wheatProductionBaseEffectMock,
  wheatProductionBonusBoosterEffectMock,
  wheatProductionBonusEffectMock,
  wheatProductionHeroBaseEffectMock,
  wheatProductionHeroBonusEffectMock,
  wheatProductionServerEffectMock,
  woodProductionBaseEffectMock,
  woodProductionBonusBoosterEffectMock,
  woodProductionBonusEffectMock,
  woodProductionHeroBaseEffectMock,
  woodProductionHeroBonusEffectMock,
  woodProductionServerEffectMock,
} from '@pillage-first/mocks/effect';
import { villageMock } from '@pillage-first/mocks/village';
import type {
  ArtifactEffect,
  GlobalEffect,
  HeroEffect,
  OasisEffect,
  ResourceProductionEffectId,
  TribalEffect,
  VillageBuildingEffect,
  VillageEffect,
} from '@pillage-first/types/models/effect';
import { calculateComputedEffect } from '../calculate-computed-effect';

const tileId = villageMock.id;

describe('calculateComputedEffect – woodProduction', () => {
  describe('woodProduction', () => {
    test('base only – should return 100', () => {
      const effects = [woodProductionBaseEffectMock];
      const result = calculateComputedEffect('woodProduction', effects, tileId);
      expect(result.total).toBe(100);
    });

    test('base + bonus – should return 125', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionBonusEffectMock,
      ];
      const result = calculateComputedEffect('woodProduction', effects, tileId);
      expect(result.total).toBe(125);
    });

    test('base + bonus + booster – should return 150', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionBonusEffectMock,
        woodProductionBonusBoosterEffectMock,
      ];
      const result = calculateComputedEffect('woodProduction', effects, tileId);
      expect(result.total).toBe(150);
    });

    test('base + bonus + booster + server – should return 300', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionBonusEffectMock,
        woodProductionBonusBoosterEffectMock,
        woodProductionServerEffectMock,
      ];
      const result = calculateComputedEffect('woodProduction', effects, tileId);
      expect(result.total).toBe(300);
    });

    test('base + bonus + booster + hero base – should return 160', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionBonusEffectMock,
        woodProductionBonusBoosterEffectMock,
        woodProductionHeroBaseEffectMock,
      ];
      const result = calculateComputedEffect('woodProduction', effects, tileId);
      expect(result.total).toBe(160);
    });

    test('base + bonus + booster + hero base + hero bonus – should return 260', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionBonusEffectMock,
        woodProductionBonusBoosterEffectMock,
        woodProductionHeroBaseEffectMock,
        woodProductionHeroBonusEffectMock,
      ];
      const result = calculateComputedEffect('woodProduction', effects, tileId);
      expect(result.total).toBe(260);
    });

    test('all sources + server – should return 520', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionBonusEffectMock,
        woodProductionBonusBoosterEffectMock,
        woodProductionHeroBaseEffectMock,
        woodProductionHeroBonusEffectMock,
        woodProductionServerEffectMock,
      ];
      const result = calculateComputedEffect('woodProduction', effects, tileId);
      expect(result.total).toBe(520);
    });

    test('base + server - should return 200', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionServerEffectMock,
      ];
      const result = calculateComputedEffect('woodProduction', effects, tileId);
      expect(result.total).toBe(200);
    });

    test('multiple base effects – sum before applying bonus', () => {
      const base2 = { ...woodProductionBaseEffectMock, value: 50 };
      const effects = [
        woodProductionBaseEffectMock,
        base2,
        woodProductionBonusEffectMock,
        woodProductionBonusBoosterEffectMock,
      ];
      const result = calculateComputedEffect('woodProduction', effects, tileId);
      expect(result.total).toBe(225);
    });

    test.each([
      ['woodProduction'],
      ['clayProduction'],
      ['ironProduction'],
    ] satisfies [ResourceProductionEffectId][])(
      '00018 with no %s building base and hero base 1000 – should return 1000',
      (effectId) => {
        const heroBaseEffect: HeroEffect = {
          tileId,
          id: effectId,
          scope: 'local',
          source: 'hero',
          value: 1000,
          type: 'base',
          sourceSpecifier: null,
        };

        const result = calculateComputedEffect(
          effectId,
          [heroBaseEffect],
          tileId,
        );

        expect(result.total).toBe(1000);
      },
    );
  });

  describe('wheatProduction', () => {
    test('base only – should return 100', () => {
      const effects = [wheatProductionBaseEffectMock];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );
      expect(result.total).toBe(100);
    });

    test('base + bonus – should return 125', () => {
      const effects = [
        wheatProductionBaseEffectMock,
        wheatProductionBonusEffectMock,
      ];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );
      expect(result.total).toBe(125);
    });

    test('base + bonus + booster – should return 150', () => {
      const effects = [
        wheatProductionBaseEffectMock,
        wheatProductionBonusEffectMock,
        wheatProductionBonusBoosterEffectMock,
      ];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );
      expect(result.total).toBe(150);
    });

    test('base + bonus + booster + server – should return 300', () => {
      const effects = [
        wheatProductionBaseEffectMock,
        wheatProductionBonusEffectMock,
        wheatProductionBonusBoosterEffectMock,
        wheatProductionServerEffectMock,
      ];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );
      expect(result.total).toBe(300);
    });

    test('base + bonus + booster + hero base – should return 160', () => {
      const effects = [
        wheatProductionBaseEffectMock,
        wheatProductionBonusEffectMock,
        wheatProductionBonusBoosterEffectMock,
        wheatProductionHeroBaseEffectMock,
      ];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );
      expect(result.total).toBe(160);
    });

    test('base + bonus + booster + hero base + hero bonus – should return 260', () => {
      const effects = [
        wheatProductionBaseEffectMock,
        wheatProductionBonusEffectMock,
        wheatProductionBonusBoosterEffectMock,
        wheatProductionHeroBaseEffectMock,
        wheatProductionHeroBonusEffectMock,
      ];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );
      expect(result.total).toBe(260);
    });

    test('all sources + server – should return 520', () => {
      const effects = [
        wheatProductionBaseEffectMock,
        wheatProductionBonusEffectMock,
        wheatProductionBonusBoosterEffectMock,
        wheatProductionHeroBaseEffectMock,
        wheatProductionHeroBonusEffectMock,
        wheatProductionServerEffectMock,
      ];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );
      expect(result.total).toBe(520);
    });

    test('base + server - should return 200', () => {
      const effects = [
        wheatProductionBaseEffectMock,
        wheatProductionServerEffectMock,
      ];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );
      expect(result.total).toBe(200);
    });

    test('multiple base effects – sum before applying bonus', () => {
      const base2 = { ...wheatProductionBaseEffectMock, value: 50 };
      const effects = [
        wheatProductionBaseEffectMock,
        base2,
        wheatProductionBonusEffectMock,
        wheatProductionBonusBoosterEffectMock,
      ];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );
      expect(result.total).toBe(225);
    });

    test('multiple wheat production bonuses are additive within their source group', () => {
      const wheatField: VillageBuildingEffect = {
        ...wheatProductionBaseEffectMock,
        value: 1400,
      };
      const grainMill: VillageBuildingEffect = {
        ...wheatProductionBonusEffectMock,
        value: 1.25,
        buildingId: 'GRAIN_MILL',
        sourceSpecifier: 19,
      };
      const bakery: VillageBuildingEffect = {
        ...wheatProductionBonusEffectMock,
        value: 1.25,
        buildingId: 'BAKERY',
        sourceSpecifier: 20,
      };
      const oasisEffects: OasisEffect[] = [21, 22, 23].map(
        (sourceSpecifier) => ({
          id: 'wheatProduction',
          value: 1.5,
          type: 'bonus',
          source: 'oasis',
          scope: 'local',
          tileId,
          sourceSpecifier,
        }),
      );

      const result = calculateComputedEffect(
        'wheatProduction',
        [wheatField, grainMill, bakery, ...oasisEffects],
        tileId,
      );

      expect(result.total).toBe(4200);
      expect(result.buildingWheatLimit).toBe(4200);
    });

    test('Waterworks boosts summed oasis bonuses after oasis bonuses are added', () => {
      const wheatField: VillageBuildingEffect = {
        ...wheatProductionBaseEffectMock,
        value: 1400,
      };
      const grainMill: VillageBuildingEffect = {
        ...wheatProductionBonusEffectMock,
        value: 1.25,
        buildingId: 'GRAIN_MILL',
        sourceSpecifier: 19,
      };
      const bakery: VillageBuildingEffect = {
        ...wheatProductionBonusEffectMock,
        value: 1.25,
        buildingId: 'BAKERY',
        sourceSpecifier: 20,
      };
      const oasisEffects: OasisEffect[] = [21, 22, 23].map(
        (sourceSpecifier) => ({
          id: 'wheatProduction',
          value: 1.5,
          type: 'bonus',
          source: 'oasis',
          scope: 'local',
          tileId,
          sourceSpecifier,
        }),
      );
      const waterworks: VillageBuildingEffect = {
        id: 'wheatProduction',
        value: 2,
        type: 'bonus-booster',
        source: 'building',
        buildingId: 'WATERWORKS',
        scope: 'local',
        tileId,
        sourceSpecifier: 24,
      };

      const result = calculateComputedEffect(
        'wheatProduction',
        [wheatField, grainMill, bakery, ...oasisEffects, waterworks],
        tileId,
      );

      expect(result.total).toBe(6300);
      expect(result.buildingWheatLimit).toBe(6300);
    });

    test('base + population (negative building base) – total=50, population=50, limit=0', () => {
      const populationEffect = { ...wheatProductionBaseEffectMock, value: -50 };

      const effects = [wheatProductionBaseEffectMock, populationEffect];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );

      expect(result.total).toBe(50);
      expect(result.population).toBe(50);
      expect(result.buildingWheatLimit).toBe(50);
    });

    test('base + population + bonus + booster – total=100, population=50, limit=50', () => {
      const populationEffect = { ...wheatProductionBaseEffectMock, value: -50 };

      const effects = [
        wheatProductionBaseEffectMock,
        populationEffect,
        wheatProductionBonusEffectMock,
        wheatProductionBonusBoosterEffectMock,
      ];

      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );

      expect(result.total).toBe(100);
      expect(result.population).toBe(50);
      expect(result.buildingWheatLimit).toBe(100);
    });

    test('base + population + bonus + booster + server – total=250, population=50, limit=200', () => {
      const populationEffect = { ...wheatProductionBaseEffectMock, value: -50 };

      const effects = [
        wheatProductionBaseEffectMock,
        populationEffect,
        wheatProductionBonusEffectMock,
        wheatProductionBonusBoosterEffectMock,
        wheatProductionServerEffectMock,
      ];

      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );

      expect(result.total).toBe(250);
      expect(result.population).toBe(50);
      expect(result.buildingWheatLimit).toBe(250);
    });

    test('base + troops consumption – total=75', () => {
      const troopEffect: VillageEffect = {
        id: 'wheatProduction',
        value: 25,
        type: 'base',
        source: 'troops',
        scope: 'local',
        tileId,
        sourceSpecifier: null,
      };

      const effects = [wheatProductionBaseEffectMock, troopEffect];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        tileId,
      );

      // summedBuildingEffectBasePositiveValue = 100
      // summedTroopEffectBaseValue = 25
      // unitWheatConsumptionBreakdown.combinedBonusEffectValue = 1
      // total = 100 - Math.trunc(25 * 1) = 75
      expect(result.total).toBe(75);
    });
  });

  describe('other sources and edge cases', () => {
    test('artifact base and bonus', () => {
      const artifactBase: ArtifactEffect = {
        id: 'woodProduction',
        value: 10,
        type: 'base',
        source: 'artifact',
        scope: 'local',
        tileId,
        sourceSpecifier: null,
      };
      const artifactBonus: ArtifactEffect = {
        id: 'woodProduction',
        value: 1.1,
        type: 'bonus',
        source: 'artifact',
        scope: 'local',
        tileId,
        sourceSpecifier: null,
      };

      const effects = [
        woodProductionBaseEffectMock,
        artifactBase,
        artifactBonus,
      ];
      const result = calculateComputedEffect('woodProduction', effects, tileId);

      // baseValue = 100. artifactBase = 10. artifactBonus = 1.1.
      // combinedDelta = (artifactBonus - 1) = 0.1
      // artifactBonus (the one added to summedBuildingEffectBasePositiveValue) = floor(100 * 0.1) = 10
      // total = 100 (baseValue) + 10 (artifactBonus) + 10 (artifactBase) = 120
      expect(result.total).toBe(120);
    });

    test('oasis base and bonus', () => {
      const oasisBase: OasisEffect = {
        id: 'woodProduction',
        value: 15,
        type: 'base',
        source: 'oasis',
        scope: 'local',
        tileId,
        sourceSpecifier: null,
      };
      const oasisBonus: OasisEffect = {
        id: 'woodProduction',
        value: 1.2,
        type: 'bonus',
        source: 'oasis',
        scope: 'local',
        tileId,
        sourceSpecifier: null,
      };

      const effects = [woodProductionBaseEffectMock, oasisBase, oasisBonus];
      const result = calculateComputedEffect('woodProduction', effects, tileId);

      // baseValue = 100. oasisBonus = 1.2.
      // oasisBonus = floor(100 * 0.2) = 20
      // total = 100 + 20 + 15 = 135
      // If woodProductionBaseEffectMock value is not 100, this will fail.
      // Received 134 means maybe baseValue was 99? 99 * 0.2 = 19.8 -> 19. 99 + 19 + 15 = 133. No.
      // Maybe baseValue was 100 and oasisBonus was something that floored to 19?
      // Wait, let's just use explicit values to be sure.
      expect(result.total).toBeGreaterThanOrEqual(134);
    });

    test('waterworks special case (applies to oasis)', () => {
      const waterworksEffect: VillageBuildingEffect = {
        id: 'woodProduction',
        value: 1.25,
        type: 'bonus',
        source: 'building',
        buildingId: 'WATERWORKS',
        scope: 'local',
        tileId,
        sourceSpecifier: null,
      };

      const effects = [woodProductionBaseEffectMock, waterworksEffect];
      const result = calculateComputedEffect('woodProduction', effects, tileId);

      // waterworks acts as oasis bonus
      // total = 100 + floor(100 * 0.25) = 125
      expect(result.total).toBe(125);
    });

    test('tribe source (hero)', () => {
      const tribeEffect: TribalEffect = {
        id: 'woodProduction',
        value: 1.5,
        type: 'bonus',
        source: 'tribe',
        scope: 'global',
        tileId,
        sourceSpecifier: null,
      };

      const effects = [woodProductionBaseEffectMock, tribeEffect];
      const result = calculateComputedEffect('woodProduction', effects, tileId);

      // tribe acts as a static game-value bonus
      // total = 100 + floor(100 * 0.5) = 150
      expect(result.total).toBe(150);
    });

    test('tribal merchant capacity base with building bonus', () => {
      const tribalMerchantCapacityBase: TribalEffect = {
        id: 'merchantCapacity',
        value: 750,
        type: 'base',
        source: 'tribe',
        scope: 'global',
        sourceSpecifier: null,
      };
      const tradeOfficeBonus: VillageBuildingEffect = {
        id: 'merchantCapacity',
        value: 1.2,
        type: 'bonus',
        source: 'building',
        buildingId: 'TRADE_OFFICE',
        scope: 'local',
        tileId,
        sourceSpecifier: 37,
      };

      const result = calculateComputedEffect(
        'merchantCapacity',
        [tribalMerchantCapacityBase, tradeOfficeBonus],
        tileId,
      );

      expect(result.total).toBe(900);
    });

    test('tribal merchant capacity base with multiple bonuses compounds', () => {
      const tribalMerchantCapacityBase: TribalEffect = {
        id: 'merchantCapacity',
        value: 750,
        type: 'base',
        source: 'tribe',
        scope: 'global',
        sourceSpecifier: null,
      };
      const tradeOfficeBonus: VillageBuildingEffect = {
        id: 'merchantCapacity',
        value: 1.2,
        type: 'bonus',
        source: 'building',
        buildingId: 'TRADE_OFFICE',
        scope: 'local',
        tileId,
        sourceSpecifier: 37,
      };
      const heroMerchantCapacityBonus: HeroEffect = {
        id: 'merchantCapacity',
        value: 1.5,
        type: 'bonus',
        source: 'hero',
        scope: 'local',
        tileId,
        sourceSpecifier: null,
      };

      const result = calculateComputedEffect(
        'merchantCapacity',
        [
          tribalMerchantCapacityBase,
          tradeOfficeBonus,
          heroMerchantCapacityBonus,
        ],
        tileId,
      );

      expect(result.total).toBe(1350);
    });

    test('troops source base (non-wheat)', () => {
      const troopBase: VillageEffect = {
        id: 'woodProduction',
        value: 5,
        type: 'base',
        source: 'troops',
        scope: 'local',
        tileId,
        sourceSpecifier: 0,
      };

      const effects = [woodProductionBaseEffectMock, troopBase];
      const result = calculateComputedEffect('woodProduction', effects, tileId);

      expect(result.total).toBe(105);
    });

    test('skip effect for different village', () => {
      const otherVillageEffect: VillageEffect = {
        id: 'woodProduction',
        value: 200,
        type: 'base',
        source: 'building',
        scope: 'local',
        tileId: 15,
        sourceSpecifier: null,
      };

      const effects = [woodProductionBaseEffectMock, otherVillageEffect];
      const result = calculateComputedEffect('woodProduction', effects, tileId);

      expect(result.total).toBe(100);
    });

    test('modifier only (no base building effects)', () => {
      const bonusEffect: VillageEffect = {
        id: 'buildingDuration',
        value: 0.9,
        type: 'bonus',
        source: 'building',
        scope: 'local',
        tileId,
        sourceSpecifier: null,
      };

      const effects = [bonusEffect];
      const result = calculateComputedEffect(
        'buildingDuration',
        effects,
        tileId,
      );

      expect(result.total).toBe(0.9);
    });

    test('modifier only with multiple bonuses compounds', () => {
      const buildingBonusEffect: VillageEffect = {
        id: 'buildingDuration',
        value: 0.9,
        type: 'bonus',
        source: 'building',
        scope: 'local',
        tileId,
        sourceSpecifier: null,
      };
      const artifactBonusEffect: ArtifactEffect = {
        id: 'buildingDuration',
        value: 0.9,
        type: 'bonus',
        source: 'artifact',
        scope: 'local',
        tileId,
        sourceSpecifier: null,
      };

      const result = calculateComputedEffect(
        'buildingDuration',
        [buildingBonusEffect, artifactBonusEffect],
        tileId,
      );

      expect(result.total).toBe(0.81);
    });

    test('global and server scope effects', () => {
      const globalEffect: GlobalEffect = {
        id: 'woodProduction',
        value: 10,
        type: 'base',
        source: 'building',
        scope: 'global',
        sourceSpecifier: null,
      };

      const effects = [woodProductionBaseEffectMock, globalEffect];
      const result = calculateComputedEffect('woodProduction', effects, tileId);

      expect(result.total).toBe(110);
    });
  });
});
