import { egyptianHero, gaulHero, hunHero, romanHero, spartanHero, teutonHero } from 'mocks/game/hero-mock';
import { QueryClient } from '@tanstack/react-query';
import { renderHookWithGameContext } from 'test-utils';
import { describe, expect } from 'vitest';
import { heroCacheKey, useHero } from 'app/[game]/hooks/use-hero';
import type { Hero } from 'interfaces/models/game/hero';

// Expected attributes for each hero
const gaulExpectedAttributes = {
  unmountedSpeed: 7,
  mountedSpeed: 19,
  baseAttackPower: 80,
  baseHealthRegenerationRate: 10,
  resourceProduction: 18,
  infantryTroopSpeedBonus: 0,
  mountedTroopSpeedBonus: 0,
};

const teutonExpectedAttributes = {
  unmountedSpeed: 7,
  mountedSpeed: 14,
  baseAttackPower: 80,
  baseHealthRegenerationRate: 20,
  resourceProduction: 18,
  infantryTroopSpeedBonus: 0,
  mountedTroopSpeedBonus: 0,
};

const romanExpectedAttributes = {
  unmountedSpeed: 7,
  mountedSpeed: 14,
  baseAttackPower: 100,
  baseHealthRegenerationRate: 10,
  resourceProduction: 18,
  infantryTroopSpeedBonus: 0,
  mountedTroopSpeedBonus: 0,
};

const egyptianExpectedAttributes = {
  unmountedSpeed: 7,
  mountedSpeed: 14,
  baseAttackPower: 80,
  baseHealthRegenerationRate: 10,
  resourceProduction: 36,
  infantryTroopSpeedBonus: 0,
  mountedTroopSpeedBonus: 0,
};

const hunExpectedAttributes = {
  unmountedSpeed: 7,
  mountedSpeed: 14,
  baseAttackPower: 80,
  baseHealthRegenerationRate: 10,
  resourceProduction: 18,
  infantryTroopSpeedBonus: 0,
  mountedTroopSpeedBonus: 3,
};

const spartanExpectedAttributes = {
  unmountedSpeed: 7,
  mountedSpeed: 14,
  baseAttackPower: 80,
  baseHealthRegenerationRate: 10,
  resourceProduction: 18,
  infantryTroopSpeedBonus: 5,
  mountedTroopSpeedBonus: 0,
};

const testHeroAttributes = (heroData: Hero, tribe: string, expectedAttributes: Record<string, number>) => {
  describe(`${tribe} hero`, () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData([heroCacheKey], heroData);
    const { result } = renderHookWithGameContext(() => useHero(), { queryClient });
    const { hero } = result.current;

    test('Unmounted speed', () => {
      expect(hero.staticAttributes.unmountedSpeed).toBe(expectedAttributes.unmountedSpeed);
    });

    test('Mounted speed', () => {
      expect(hero.staticAttributes.mountedSpeed).toBe(expectedAttributes.mountedSpeed);
    });

    test('Base attack power', () => {
      expect(hero.staticAttributes.baseAttackPower).toBe(expectedAttributes.baseAttackPower);
    });

    test('Base health regeneration rate', () => {
      expect(hero.staticAttributes.baseHealthRegenerationRate).toBe(expectedAttributes.baseHealthRegenerationRate);
    });

    test('Resource production', () => {
      expect(hero.staticAttributes.resourceProduction).toBe(expectedAttributes.resourceProduction);
    });

    test('Infantry troop speed bonus', () => {
      expect(hero.staticAttributes.infantryTroopSpeedBonus).toBe(expectedAttributes.infantryTroopSpeedBonus);
    });

    test('Mounted troop speed bonus', () => {
      expect(hero.staticAttributes.mountedTroopSpeedBonus).toBe(expectedAttributes.mountedTroopSpeedBonus);
    });
  });
};

describe('useHero', () => {
  testHeroAttributes(gaulHero, 'Gaul', gaulExpectedAttributes);
  testHeroAttributes(teutonHero, 'Teuton', teutonExpectedAttributes);
  testHeroAttributes(romanHero, 'Roman', romanExpectedAttributes);
  testHeroAttributes(egyptianHero, 'Egyptian', egyptianExpectedAttributes);
  testHeroAttributes(hunHero, 'Hun', hunExpectedAttributes);
  testHeroAttributes(spartanHero, 'Spartan', spartanExpectedAttributes);
});
