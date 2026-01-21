import { describe, expect, test } from 'vitest';
import {
  calculateDistanceBetweenPoints,
  roundTo5,
  roundToNDecimalPoints,
} from '../math';

describe('math utils', () => {
  describe('calculateDistanceBetweenPoints', () => {
    test('should calculate distance between two points', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      expect(calculateDistanceBetweenPoints(p1, p2)).toBe(5);
    });

    test('should handle negative coordinates', () => {
      const p1 = { x: -1, y: -1 };
      const p2 = { x: 2, y: 2 };
      // sqrt((2 - -1)^2 + (2 - -1)^2) = sqrt(3^2 + 3^2) = sqrt(18) ≈ 4.24264
      expect(calculateDistanceBetweenPoints(p1, p2)).toBeCloseTo(4.24_264);
    });
  });

  describe('roundToNDecimalPoints', () => {
    test('should round to 2 decimal points by default', () => {
      expect(roundToNDecimalPoints(1.23_456)).toBe(1.23);
      expect(roundToNDecimalPoints(1.235)).toBe(1.24);
    });

    test('should round to N decimal points', () => {
      expect(roundToNDecimalPoints(1.23_456, 3)).toBe(1.235);
      expect(roundToNDecimalPoints(1.23_456, 0)).toBe(1);
    });
  });

  describe('roundTo5', () => {
    test('should round to the nearest 5', () => {
      expect(roundTo5(2)).toBe(0);
      expect(roundTo5(3)).toBe(5);
      expect(roundTo5(7)).toBe(5);
      expect(roundTo5(8)).toBe(10);
      expect(roundTo5(12.5)).toBe(15);
    });
  });
});
