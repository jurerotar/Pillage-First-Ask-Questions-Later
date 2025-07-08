import { describe, expect, test } from 'vitest';
import {
  calculateHeroLevel,
  calculateHeroRevivalCost,
  calculateHeroRevivalTime,
} from '../hero';

describe('calculateHeroLevel (level starts at 0)', () => {
  test('should return level 0 at 0 exp', () => {
    expect(calculateHeroLevel(0)).toEqual({
      level: 0,
      currentLevelExp: 0,
      expToNextLevel: 50,
      percentToNextLevel: 0,
    });
  });

  test('should return level 1 at 50 exp', () => {
    expect(calculateHeroLevel(50)).toEqual({
      level: 1,
      currentLevelExp: 50,
      expToNextLevel: 100,
      percentToNextLevel: 0,
    });
  });

  test('should return level 2 at 150 exp', () => {
    expect(calculateHeroLevel(150)).toEqual({
      level: 2,
      currentLevelExp: 150,
      expToNextLevel: 150,
      percentToNextLevel: 0,
    });
  });

  test('should return level 3 at 300 exp', () => {
    expect(calculateHeroLevel(300)).toEqual({
      level: 3,
      currentLevelExp: 300,
      expToNextLevel: 200,
      percentToNextLevel: 0,
    });
  });

  test('should return level 5 at 1000 exp', () => {
    expect(calculateHeroLevel(1000)).toEqual({
      level: 5,
      currentLevelExp: 750,
      expToNextLevel: 50,
      percentToNextLevel: 83, // Math.floor(250 / 300 * 100)
    });
  });

  test('should return level 6 at 1050 exp', () => {
    expect(calculateHeroLevel(1050)).toEqual({
      level: 6,
      currentLevelExp: 1050,
      expToNextLevel: 350,
      percentToNextLevel: 0,
    });
  });
});

describe('calculateHeroRevivalCost', () => {
  test('should calculate revival cost for romans at level 0', () => {
    const result = calculateHeroRevivalCost('romans', 0);
    expect(result).toEqual([130, 115, 180, 75]);
  });

  test('should scale correctly for romans at level 1', () => {
    const result = calculateHeroRevivalCost('romans', 1);
    const expected = [270, 240, 375, 155];
    expect(result).toEqual(expected);
  });

  test('should calculate correct cost for teutons at level 5', () => {
    const result = calculateHeroRevivalCost('teutons', 5);
    const expected = [1305, 940, 835, 545];
    expect(result).toEqual(expected);
  });
});

describe('calculateHeroRevivalTime', () => {
  test('should calculate 15 minutes at level 1', () => {
    expect(calculateHeroRevivalTime(1)).toBe(15 * 60 * 1000);
  });

  test('should calculate 150 minutes at level 10', () => {
    expect(calculateHeroRevivalTime(10)).toBe(150 * 60 * 1000);
  });

  test('should cap at 6 hours (360 minutes)', () => {
    expect(calculateHeroRevivalTime(30)).toBe(360 * 60 * 1000);
    expect(calculateHeroRevivalTime(100)).toBe(360 * 60 * 1000);
  });
});
