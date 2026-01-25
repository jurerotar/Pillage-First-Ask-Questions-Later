import { describe, expect, test } from 'vitest';
import { generateHashKey, transformToHashed } from '../hash.ts';

describe(generateHashKey, () => {
  test('generates a 6-character hex hash', () => {
    const hash = generateHashKey('test');
    expect(hash).toHaveLength(6);
    expect(hash).toMatch(/^[0-9a-f]{6}$/);
  });

  test('generates the same hash for the same input', () => {
    expect(generateHashKey('hello')).toBe(generateHashKey('hello'));
  });

  test('generates different hashes for different inputs', () => {
    expect(generateHashKey('hello')).not.toBe(generateHashKey('world'));
  });
});

describe(transformToHashed, () => {
  test('transforms keys to hashes', () => {
    const input = {
      Save: 'Save',
      Cancel: 'Cancel',
    };
    const result = transformToHashed(input);
    expect(result[generateHashKey('Save')]).toBe('Save');
    expect(result[generateHashKey('Cancel')]).toBe('Cancel');
  });
});
