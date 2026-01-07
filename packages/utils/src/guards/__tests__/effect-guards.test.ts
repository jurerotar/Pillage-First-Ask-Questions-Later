import { describe, expect, test } from 'vitest';
import {
  woodProductionArtifactEffectMock,
  woodProductionBaseEffectMock,
  woodProductionHeroBaseEffectMock,
  woodProductionOasisEffectMock,
  woodProductionServerEffectMock,
} from '@pillage-first/mocks/effect';
import {
  isArtifactEffect,
  isBuildingEffect,
  isHeroEffect,
  isOasisEffect,
  isServerEffect,
  isVillageEffect,
} from '../effect-guards';

describe('effect guards', () => {
  test('should identify server effects', () => {
    expect(isServerEffect(woodProductionServerEffectMock)).toBe(true);
    expect(isServerEffect(woodProductionBaseEffectMock)).toBe(false);
  });

  test('should identify village effects', () => {
    expect(isVillageEffect(woodProductionBaseEffectMock)).toBe(true);
    expect(isVillageEffect(woodProductionServerEffectMock)).toBe(false);
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
