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
import { calculateComputedEffect } from '../calculate-computed-effect';

const villageId = villageMock.id;

describe('calculateComputedEffect – woodProduction', () => {
  describe('woodProduction', () => {
    test('base only – should return 100', () => {
      const effects = [woodProductionBaseEffectMock];
      const result = calculateComputedEffect(
        'woodProduction',
        effects,
        villageId,
      );
      expect(result.total).toBe(100);
    });

    test('base + bonus – should return 125', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionBonusEffectMock,
      ];
      const result = calculateComputedEffect(
        'woodProduction',
        effects,
        villageId,
      );
      expect(result.total).toBe(125);
    });

    test('base + bonus + booster – should return 150', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionBonusEffectMock,
        woodProductionBonusBoosterEffectMock,
      ];
      const result = calculateComputedEffect(
        'woodProduction',
        effects,
        villageId,
      );
      expect(result.total).toBe(150);
    });

    test('base + bonus + booster + server – should return 300', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionBonusEffectMock,
        woodProductionBonusBoosterEffectMock,
        woodProductionServerEffectMock,
      ];
      const result = calculateComputedEffect(
        'woodProduction',
        effects,
        villageId,
      );
      expect(result.total).toBe(300);
    });

    test('base + bonus + booster + hero base – should return 160', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionBonusEffectMock,
        woodProductionBonusBoosterEffectMock,
        woodProductionHeroBaseEffectMock,
      ];
      const result = calculateComputedEffect(
        'woodProduction',
        effects,
        villageId,
      );
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
      const result = calculateComputedEffect(
        'woodProduction',
        effects,
        villageId,
      );
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
      const result = calculateComputedEffect(
        'woodProduction',
        effects,
        villageId,
      );
      expect(result.total).toBe(520);
    });

    test('base + server - should return 200', () => {
      const effects = [
        woodProductionBaseEffectMock,
        woodProductionServerEffectMock,
      ];
      const result = calculateComputedEffect(
        'woodProduction',
        effects,
        villageId,
      );
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
      const result = calculateComputedEffect(
        'woodProduction',
        effects,
        villageId,
      );
      expect(result.total).toBe(225);
    });
  });

  describe('wheatProduction', () => {
    test('base only – should return 100', () => {
      const effects = [wheatProductionBaseEffectMock];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        villageId,
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
        villageId,
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
        villageId,
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
        villageId,
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
        villageId,
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
        villageId,
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
        villageId,
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
        villageId,
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
        villageId,
      );
      expect(result.total).toBe(225);
    });

    test('base + population (negative building base) – total=50, population=50, limit=0', () => {
      const populationEffect = { ...wheatProductionBaseEffectMock, value: -50 };

      const effects = [wheatProductionBaseEffectMock, populationEffect];
      const result = calculateComputedEffect(
        'wheatProduction',
        effects,
        villageId,
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
        villageId,
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
        villageId,
      );

      expect(result.total).toBe(250);
      expect(result.population).toBe(50);
      expect(result.buildingWheatLimit).toBe(250);
    });
  });

  // describe('New village effects', () => {
  //   test('should have a total of 800 warehouse capacity on a new village', () => {
  //     const effects = newVillageEffectsFactory(villageMock);
  //
  //     const result = calculateComputedEffect(
  //       'warehouseCapacity',
  //       effects,
  //       villageId,
  //     );
  //     expect(result.total).toBe(800);
  //   });
  //
  //   test('should have a total of 800 granary capacity on a new village', () => {
  //     const effects = newVillageEffectsFactory(villageMock);
  //
  //     const result = calculateComputedEffect(
  //       'granaryCapacity',
  //       effects,
  //       villageId,
  //     );
  //     expect(result.total).toBe(800);
  //   });
  //
  //   test('should have a building duration modifier of 1 on a new village', () => {
  //     const effects = newVillageEffectsFactory(villageMock);
  //
  //     const result = calculateComputedEffect(
  //       'buildingDuration',
  //       effects,
  //       villageId,
  //     );
  //     expect(result.total).toBe(1);
  //   });
  // });
  //
  // test.skip('should have a building duration modifier of 1 on a new village', () => {
  //   const { effects: buildingEffects } = getBuildingDefinition('MAIN_BUILDING');
  //   const level = 2;
  //
  //   const effects = buildingEffects.map(
  //     ({ effectId, valuesPerLevel, type }) => {
  //       return newBuildingEffectFactory({
  //         villageId,
  //         id: effectId,
  //         value: valuesPerLevel[level],
  //         buildingFieldId: 1,
  //         buildingId: 'MAIN_BUILDING',
  //         type,
  //       });
  //     },
  //   );
  //
  //   const result = calculateComputedEffect(
  //     'buildingDuration',
  //     effects,
  //     villageId,
  //   );
  //
  //   expect(result.total).toBe(1);
  // });
});
