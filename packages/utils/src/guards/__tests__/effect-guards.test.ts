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
    expect(isServerEffect(woodProductionServerEffectMock)).toBeTruthy();
    expect(isServerEffect(woodProductionBaseEffectMock)).toBeFalsy();
  });

  test('should identify village effects', () => {
    expect(isVillageEffect(woodProductionBaseEffectMock)).toBeTruthy();
    expect(isVillageEffect(woodProductionServerEffectMock)).toBeFalsy();
  });

  test('should identify building effects', () => {
    expect(isBuildingEffect(woodProductionBaseEffectMock)).toBeTruthy();
    expect(isBuildingEffect(woodProductionHeroBaseEffectMock)).toBeFalsy();
    expect(isBuildingEffect(woodProductionServerEffectMock)).toBeFalsy();
  });

  test('should identify artifact effects', () => {
    expect(isArtifactEffect(woodProductionArtifactEffectMock)).toBeTruthy();
    expect(isArtifactEffect(woodProductionHeroBaseEffectMock)).toBeFalsy();
  });

  test('should identify hero effects', () => {
    expect(isHeroEffect(woodProductionHeroBaseEffectMock)).toBeTruthy();
    expect(isHeroEffect(woodProductionArtifactEffectMock)).toBeFalsy();
  });

  test('should identify oasis effects', () => {
    expect(isOasisEffect(woodProductionOasisEffectMock)).toBeTruthy();
    expect(isOasisEffect(woodProductionHeroBaseEffectMock)).toBeFalsy();
  });
});
