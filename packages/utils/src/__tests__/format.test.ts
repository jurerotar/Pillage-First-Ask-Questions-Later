import { describe, expect, test } from 'vitest';
import {
  formatNumber,
  formatNumberWithCommas,
  formatPercentage,
  truncateToShortForm,
} from '../format';

describe('format utils', () => {
  describe(formatNumberWithCommas, () => {
    test('should format numbers with commas', () => {
      expect(formatNumberWithCommas(1000)).toBe('1,000');
      expect(formatNumberWithCommas(1_000_000)).toBe('1,000,000');
      expect(formatNumberWithCommas(100)).toBe('100');
    });
  });

  describe(truncateToShortForm, () => {
    test('should truncate numbers to K for thousands', () => {
      expect(truncateToShortForm(1000)).toBe('1K');
      expect(truncateToShortForm(1500)).toBe('1.5K');
      expect(truncateToShortForm(99_900)).toBe('99.9K');
      expect(truncateToShortForm(100_000)).toBe('100K');
    });

    test('should truncate numbers to M for millions', () => {
      expect(truncateToShortForm(1_000_000)).toBe('1M');
      expect(truncateToShortForm(1_500_000)).toBe('1.5M');
      expect(truncateToShortForm(99_900_000)).toBe('99.9M');
      expect(truncateToShortForm(100_000_000)).toBe('100M');
    });

    test('should handle negative numbers', () => {
      expect(truncateToShortForm(-1000)).toBe('-1K');
      expect(truncateToShortForm(-1_500_000)).toBe('-1.5M');
    });

    test('should return the number as a string if less than 1000', () => {
      expect(truncateToShortForm(500)).toBe('500');
      expect(truncateToShortForm(0)).toBe('0');
      expect(truncateToShortForm(-500)).toBe('-500');
    });
  });

  describe(formatPercentage, () => {
    test('should return 0% or 100% when num is 1', () => {
      expect(formatPercentage(1, true)).toBe('0%');
      expect(formatPercentage(1, false)).toBe('100%');
    });

    test('should format percentage based on fractional part', () => {
      expect(formatPercentage(1.25)).toBe('25%');
      expect(formatPercentage(0.75)).toBe('75%');
      expect(formatPercentage(2.1)).toBe('10%');
    });
  });

  describe(formatNumber, () => {
    test('should return NaN for non-integer numbers', () => {
      expect(formatNumber(1.5)).toBe('NaN');
    });

    test('should format integer numbers using toLocaleString', () => {
      expect(formatNumber(1000)).toBe((1000).toLocaleString());
      expect(formatNumber(0)).toBe('0');
    });
  });
});
