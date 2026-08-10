import { describe, expect, test } from 'vitest';
import {
  unitSpeedHeroBonusEffectMock,
  wheatProductionServerEffectMock,
  woodProductionArtifactEffectMock,
  woodProductionBaseEffectMock,
  woodProductionBonusEffectMock,
  woodProductionHeroBaseEffectMock,
  woodProductionOasisEffectMock,
  woodProductionServerEffectMock,
} from '@pillage-first/mocks/effect';
import {
  isAdditiveBonusEffect,
  isArtifactEffect,
  isBuildingEffect,
  isHeroEffect,
  isLocalEffect,
  isMultiplicativeBonusEffect,
  isOasisEffect,
  isResourceProductionEffectId,
  isServerEffect,
} from '../effect-guards';

describe('effect guards', () => {
  test('should identify resource production effect ids', () => {
    expect(isResourceProductionEffectId('woodProduction')).toBe(true);
    expect(isResourceProductionEffectId('clayProduction')).toBe(true);
    expect(isResourceProductionEffectId('ironProduction')).toBe(true);
    expect(isResourceProductionEffectId('wheatProduction')).toBe(true);
    expect(isResourceProductionEffectId('merchantCapacity')).toBe(false);
  });

  test('should identify additive bonus effects', () => {
    expect(isAdditiveBonusEffect(woodProductionBonusEffectMock)).toBe(true);
    expect(isAdditiveBonusEffect(unitSpeedHeroBonusEffectMock)).toBe(false);
    expect(isAdditiveBonusEffect(wheatProductionServerEffectMock)).toBe(false);
    expect(isAdditiveBonusEffect(woodProductionBaseEffectMock)).toBe(false);
  });

  test('should identify multiplicative bonus effects', () => {
    expect(isMultiplicativeBonusEffect(unitSpeedHeroBonusEffectMock)).toBe(
      true,
    );
    expect(isMultiplicativeBonusEffect(wheatProductionServerEffectMock)).toBe(
      true,
    );
    expect(isMultiplicativeBonusEffect(woodProductionBonusEffectMock)).toBe(
      false,
    );
    expect(isMultiplicativeBonusEffect(woodProductionBaseEffectMock)).toBe(
      false,
    );
  });

  test('should identify server effects', () => {
    expect(isServerEffect(woodProductionServerEffectMock)).toBe(true);
    expect(isServerEffect(woodProductionBaseEffectMock)).toBe(false);
  });

  test('should identify local effects', () => {
    expect(isLocalEffect(woodProductionBaseEffectMock)).toBe(true);
    expect(isLocalEffect(woodProductionServerEffectMock)).toBe(false);
  });

  test('should identify building effects', () => {
    expect(isBuildingEffect(woodProductionBaseEffectMock)).toBe(true);
    expect(isBuildingEffect(woodProductionHeroBaseEffectMock)).toBe(false);
    expect(isBuildingEffect(woodProductionServerEffectMock)).toBe(false);
  });

  test('should identify artifact effects', () => {
    expect(isArtifactEffect(woodProductionArtifactEffectMock)).toBe(true);
    expect(isArtifactEffect(woodProductionHeroBaseEffectMock)).toBe(false);
  });

  test('should identify hero effects', () => {
    expect(isHeroEffect(woodProductionHeroBaseEffectMock)).toBe(true);
    expect(isHeroEffect(woodProductionArtifactEffectMock)).toBe(false);
  });

  test('should identify oasis effects', () => {
    expect(isOasisEffect(woodProductionOasisEffectMock)).toBe(true);
    expect(isOasisEffect(woodProductionHeroBaseEffectMock)).toBe(false);
  });
});
