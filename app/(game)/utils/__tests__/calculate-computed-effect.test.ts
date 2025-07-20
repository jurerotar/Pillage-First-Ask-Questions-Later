import { describe, expect, test } from 'vitest';
import { calculateComputedEffect } from 'app/(game)/utils/calculate-computed-effect';
import { villageMock } from 'app/tests/mocks/game/village/village-mock';
import {
  wheatProductionBonusEffect,
  wheatProductionEffect,
  woodProductionBonusEffect,
  woodProductionEffect,
} from 'app/tests/mocks/game/effect-mock';
import { newVillageEffectsFactory } from 'app/factories/effect-factory';

const villageId = villageMock.id;

describe('calculateComputedEffect', () => {
  test('should have a total of 100 wood production', () => {
    const effects = [woodProductionEffect];

    const result = calculateComputedEffect(
      'woodProduction',
      effects,
      villageId,
    );
    expect(result.total).toBe(100);
  });

  test('should have a total of 125 wood production with 25% bonus', () => {
    const effects = [woodProductionEffect, woodProductionBonusEffect];

    const result = calculateComputedEffect(
      'woodProduction',
      effects,
      villageId,
    );
    expect(result.total).toBe(125);
  });

  test('should have a total of 100 wheat production', () => {
    const effects = [wheatProductionEffect];

    const result = calculateComputedEffect(
      'wheatProduction',
      effects,
      villageId,
    );
    expect(result.total).toBe(100);
  });

  test('should have a total of 125 wheat production with 25% bonus', () => {
    const effects = [wheatProductionEffect, wheatProductionBonusEffect];

    const result = calculateComputedEffect(
      'wheatProduction',
      effects,
      villageId,
    );
    expect(result.total).toBe(125);
  });

  test('should have a total of 800 warehouse capacity on a new village', () => {
    const effects = newVillageEffectsFactory(villageMock);

    const result = calculateComputedEffect(
      'warehouseCapacity',
      effects,
      villageId,
    );
    expect(result.total).toBe(800);
  });

  test('should have a building duration modifier of 1 on a new village', () => {
    const effects = newVillageEffectsFactory(villageMock);

    const result = calculateComputedEffect(
      'buildingDuration',
      effects,
      villageId,
    );
    expect(result.total).toBe(1);
  });
});
