import { describe, expect, test } from 'vitest';
import {
  encodeAppVersionToDatabaseUserVersion,
  parseAppVersion,
  parseDatabaseUserVersion,
} from '../version.js';

describe('version utils', () => {
  describe(parseAppVersion, () => {
    test('should correctly parse a standard semver-like version string', () => {
      expect(parseAppVersion('1.2.3')).toStrictEqual([1, 2, 3]);
      expect(parseAppVersion('10.20.30')).toStrictEqual([10, 20, 30]);
      expect(parseAppVersion('0.0.1')).toStrictEqual([0, 0, 1]);
    });

    test('should handle version strings with leading zeros', () => {
      expect(parseAppVersion('01.02.03')).toStrictEqual([1, 2, 3]);
    });
  });

  describe(parseDatabaseUserVersion, () => {
    test('should correctly parse a numeric database version', () => {
      // 1 * 1_000_000 + 2 * 1_000 + 3 = 1_002_003
      expect(parseDatabaseUserVersion(1_002_003)).toStrictEqual([1, 2, 3]);
      // 10 * 1_000_000 + 20 * 1_000 + 30 = 10_020_030
      expect(parseDatabaseUserVersion(10_020_030)).toStrictEqual([10, 20, 30]);
      // 0 * 1_000_000 + 0 * 1_000 + 1 = 1
      expect(parseDatabaseUserVersion(1)).toStrictEqual([0, 0, 1]);
    });
  });

  describe(encodeAppVersionToDatabaseUserVersion, () => {
    test('should correctly encode a version string to a numeric database version', () => {
      expect(encodeAppVersionToDatabaseUserVersion('1.2.3')).toBe(1_002_003);
      expect(encodeAppVersionToDatabaseUserVersion('10.20.30')).toBe(
        10_020_030,
      );
      expect(encodeAppVersionToDatabaseUserVersion('0.0.1')).toBe(1);
    });
  });
});
