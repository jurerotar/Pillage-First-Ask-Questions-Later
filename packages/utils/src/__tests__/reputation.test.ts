import { describe, expect, test } from 'vitest';
import { reputationLevels } from '@pillage-first/game-assets/reputation';
import { getReputationLevel } from '../reputation';

describe('getReputationLevel', () => {
  const entries = [...reputationLevels.entries()]; // ordered: highest -> lowest

  test('returns "player" for null value', () => {
    expect(getReputationLevel(null)).toBe('player');
  });

  test('exact thresholds map to their levels', () => {
    for (const [level, threshold] of entries) {
      expect(getReputationLevel(threshold)).toBe(level);
    }
  });

  test('values just below a threshold map to the next lower level', () => {
    for (let i = 0; i < entries.length - 1; i += 1) {
      const [, threshold] = entries[i];
      const [nextLevel] = entries[i + 1];
      expect(getReputationLevel(threshold - 1)).toBe(nextLevel);
    }
  });

  test('negative values are "hated"', () => {
    expect(getReputationLevel(-1)).toBe('hated');
  });
});
