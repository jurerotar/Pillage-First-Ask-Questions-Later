import { describe, expect, test } from 'vitest';
import { calculateHeroLevel } from '../hero';

describe('calculateHeroLevel (level starts at 0)', () => {
  test('should return level 0 at 0 exp', () => {
    expect(calculateHeroLevel(0)).toEqual({ level: 0, expToNextLevel: 50 });
  });

  test('should return level 1 at 50 exp', () => {
    expect(calculateHeroLevel(50)).toEqual({ level: 1, expToNextLevel: 100 });
  });

  test('should return level 2 at 150 exp', () => {
    expect(calculateHeroLevel(150)).toEqual({ level: 2, expToNextLevel: 150 });
  });

  test('should return level 3 at 300 exp', () => {
    expect(calculateHeroLevel(300)).toEqual({ level: 3, expToNextLevel: 200 });
  });

  test('should return level 5 at 1000 exp', () => {
    expect(calculateHeroLevel(1000)).toEqual({ level: 5, expToNextLevel: 50 });
  });

  test('should return level 6 at 1050 exp', () => {
    expect(calculateHeroLevel(1050)).toEqual({ level: 6, expToNextLevel: 350 });
  });
});
