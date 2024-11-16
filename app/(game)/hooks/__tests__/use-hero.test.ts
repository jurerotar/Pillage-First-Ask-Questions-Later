import { QueryClient } from '@tanstack/react-query';
import { useHero } from 'app/(game)/hooks/use-hero';
import type { Hero } from 'app/interfaces/models/game/hero';
import { egyptianHero, gaulHero, hunHero, romanHero, teutonHero } from 'app/tests/mocks/game/hero-mock';
import { renderHookWithGameContext } from 'app/tests/test-utils.js';
import { describe, expect, test } from 'vitest';
import { heroCacheKey } from 'app/query-keys';

// Expected attributes for each hero
const gaulExpectedAttributes = {
  unmountedSpeed: 7,
  mountedSpeed: 19,
  baseAttackPower: 80,
  baseHealthRegenerationRate: 10,
};

const teutonExpectedAttributes = {
  unmountedSpeed: 7,
  mountedSpeed: 14,
  baseAttackPower: 80,
  baseHealthRegenerationRate: 20,
};

const romanExpectedAttributes = {
  unmountedSpeed: 7,
  mountedSpeed: 14,
  baseAttackPower: 100,
  baseHealthRegenerationRate: 10,
};

const egyptianExpectedAttributes = {
  unmountedSpeed: 7,
  mountedSpeed: 14,
  baseAttackPower: 80,
  baseHealthRegenerationRate: 10,
};

const hunExpectedAttributes = {
  unmountedSpeed: 7,
  mountedSpeed: 14,
  baseAttackPower: 80,
  baseHealthRegenerationRate: 10,
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
  });
};

describe('useHero', () => {
  testHeroAttributes(gaulHero, 'Gaul', gaulExpectedAttributes);
  testHeroAttributes(teutonHero, 'Teuton', teutonExpectedAttributes);
  testHeroAttributes(romanHero, 'Roman', romanExpectedAttributes);
  testHeroAttributes(egyptianHero, 'Egyptian', egyptianExpectedAttributes);
  testHeroAttributes(hunHero, 'Hun', hunExpectedAttributes);
});
