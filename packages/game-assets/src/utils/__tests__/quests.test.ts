import { describe, expect, test } from 'vitest';
import { getQuestRequirements, getQuestRewards } from '../quests';

describe('quest utils', () => {
  describe(getQuestRequirements, () => {
    test('queuedTroopCount requirement parsed correctly', () => {
      const reqs = getQuestRequirements('queuedTroopCount-5');
      expect(reqs).toHaveLength(1);
      expect(reqs[0]).toStrictEqual({
        type: 'queued-troop-count',
        count: 5,
      });
    });

    test('queuedTroopCountById requirement parsed correctly', () => {
      const reqs = getQuestRequirements('queuedTroopCountById-LEGIONNAIRE-5');
      expect(reqs).toHaveLength(1);
      expect(reqs[0]).toStrictEqual({
        type: 'queued-troop-count-by-id',
        count: 5,
      });
    });

    test('adventureCount requirement parsed correctly', () => {
      const reqs = getQuestRequirements('adventureCount-3');
      expect(reqs).toHaveLength(1);
      expect(reqs[0]).toStrictEqual({
        type: 'adventure-count',
        count: 3,
      });
    });

    test('captureAnimalCountById requirement parsed correctly', () => {
      const reqs = getQuestRequirements('captureAnimalCountById-RAT-5');
      expect(reqs).toHaveLength(1);
      expect(reqs[0]).toStrictEqual({
        type: 'capture-animal-count-by-id',
        unitId: 'RAT',
        count: 5,
      });
    });

    test('captureAnimalKindCount requirement parsed correctly', () => {
      const reqs = getQuestRequirements('captureAnimalKindCount-10');
      expect(reqs).toHaveLength(1);
      expect(reqs[0]).toStrictEqual({
        type: 'capture-animal-kind-count',
        count: 10,
      });
    });

    test('gatheredResourceCount requirement parsed correctly', () => {
      const reqs = getQuestRequirements('gatheredResourceCount-100');
      expect(reqs).toHaveLength(1);
      expect(reqs[0]).toStrictEqual({
        type: 'gathered-resource-count',
        count: 100,
      });
    });

    test('building requirement parsed correctly (oneOf)', () => {
      const reqs = getQuestRequirements('oneOf-WOODCUTTER-4');
      expect(reqs).toHaveLength(1);
      expect(reqs[0]).toStrictEqual({
        type: 'building',
        buildingId: 'WOODCUTTER',
        level: 4,
        matcher: 'oneOf',
      });
    });

    test('building requirement parsed correctly (every)', () => {
      const reqs = getQuestRequirements('every-CLAY_PIT-2');
      expect(reqs).toHaveLength(1);
      expect(reqs[0]).toStrictEqual({
        type: 'building',
        buildingId: 'CLAY_PIT',
        level: 2,
        matcher: 'every',
      });
    });
  });

  describe(getQuestRewards, () => {
    test('queuedTroopCount rewards produce resources = count * 10', () => {
      const rewards = getQuestRewards('queuedTroopCount-5');
      expect(rewards).toHaveLength(1);
      expect(rewards[0]).toStrictEqual({
        type: 'resources',
        amount: 5 * 10,
      });
    });

    test('queuedTroopCountById rewards produce resources = count * 100', () => {
      const rewards = getQuestRewards('queuedTroopCountById-LEGIONNAIRE-5');
      expect(rewards).toHaveLength(1);
      expect(rewards[0]).toStrictEqual({
        type: 'resources',
        amount: 5 * 100,
      });
    });

    test('adventureCount rewards produce hero-exp = count * 10', () => {
      const rewards = getQuestRewards('adventureCount-4');
      expect(rewards).toHaveLength(1);
      expect(rewards[0]).toStrictEqual({
        type: 'hero-exp',
        amount: 4 * 10,
      });
    });

    test('captureAnimalCountById rewards produce hero-exp = count * 10', () => {
      const rewards = getQuestRewards('captureAnimalCountById-RAT-5');
      expect(rewards).toHaveLength(1);
      expect(rewards[0]).toStrictEqual({
        type: 'hero-exp',
        amount: 5 * 10,
      });
    });

    test('captureAnimalKindCount rewards produce hero-exp = count * 10', () => {
      const rewards = getQuestRewards('captureAnimalKindCount-10');
      expect(rewards).toHaveLength(1);
      expect(rewards[0]).toStrictEqual({
        type: 'hero-exp',
        amount: 10 * 10,
      });
    });

    test('gatheredResourceCount rewards produce scaled hero-exp', () => {
      const rewards = getQuestRewards('gatheredResourceCount-500');
      expect(rewards).toHaveLength(1);
      expect(rewards[0]).toStrictEqual({
        type: 'hero-exp',
        amount: 5,
      });
    });

    test('woodcutter oneOf level 1 (effectiveLevel=0) returns base/2', () => {
      const base = 100;
      const level = 1;
      const effectiveLevel = level - 1;
      const expected = Math.round(base * effectiveLevel) + base / 2;
      const rewards = getQuestRewards('oneOf-WOODCUTTER-1');
      expect(rewards).toHaveLength(1);
      expect(rewards[0]).toStrictEqual({
        type: 'resources',
        amount: expected,
      });
    });

    test('woodcutter oneOf level 3 calculation', () => {
      const base = 100;
      const level = 3;
      const effectiveLevel = level - 1; // 2
      const expected = Math.round(base * effectiveLevel) + base / 2;
      const rewards = getQuestRewards('oneOf-WOODCUTTER-3');
      expect(rewards).toHaveLength(1);
      expect(rewards[0]).toStrictEqual({
        type: 'resources',
        amount: expected,
      });
    });

    test('clay pit every matcher uses power 1.3 formula', () => {
      const base = 150;
      const level = 5;
      const effectiveLevel = level - 1;
      const expected = Math.round(base * effectiveLevel ** 1.3) + base / 2;
      const rewards = getQuestRewards('every-CLAY_PIT-5');
      expect(rewards).toHaveLength(1);
      expect(rewards[0]).toStrictEqual({
        type: 'resources',
        amount: expected,
      });
    });
  });
});
