import { describe, expect, test } from 'vitest';
import { getQuestRequirements, getQuestRewards } from '../quests';

describe('Quest utils', () => {
  describe('getQuestRequirements', () => {
    test('troopCount requirement parsed correctly', () => {
      const reqs = getQuestRequirements('troopCount-5');
      expect(reqs).toHaveLength(1);
      expect(reqs[0]).toStrictEqual({
        type: 'troop-count',
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

  describe('getQuestRewards', () => {
    test('troopCount rewards produce resources = count * 10', () => {
      const rewards = getQuestRewards('troopCount-5');
      expect(rewards).toHaveLength(1);
      expect(rewards[0]).toStrictEqual({
        type: 'resources',
        amount: 5 * 10,
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

    test('WOODCUTTER oneOf level 1 (effectiveLevel=0) returns base/2', () => {
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

    test('WOODCUTTER oneOf level 3 calculation', () => {
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

    test('CLAY_PIT every matcher uses power 1.3 formula', () => {
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
