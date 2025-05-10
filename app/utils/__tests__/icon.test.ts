import { describe, test, expect } from 'vitest';
import { unitIdToUnitIconMapper } from '../icon';

describe('unitIdToUnitIconMapper', () => {
  test('converts a basic unit ID to camelCase', () => {
    expect(unitIdToUnitIconMapper('LEGIONNAIRE')).toBe('legionnaire');
    expect(unitIdToUnitIconMapper('PRAETORIAN')).toBe('praetorian');
    expect(unitIdToUnitIconMapper('AXEMAN')).toBe('axeman');
  });

  test('converts complex unit IDs to camelCase', () => {
    expect(unitIdToUnitIconMapper('EQUITES_CAESARIS')).toBe('equitesCaesaris');
    expect(unitIdToUnitIconMapper('TEUTONIC_KNIGHT')).toBe('teutonicKnight');
    expect(unitIdToUnitIconMapper('STEPPE_RIDER')).toBe('steppeRider');
    expect(unitIdToUnitIconMapper('CORINTHIAN_CRUSHER')).toBe('corinthianCrusher');
  });

  test('handles computed units correctly', () => {
    expect(unitIdToUnitIconMapper('ROMAN_CHIEF')).toBe('romanChief');
    expect(unitIdToUnitIconMapper('GAUL_CATAPULT')).toBe('gaulCatapult');
    expect(unitIdToUnitIconMapper('NATARIAN_SCOUT')).toBe('natarianScout');
  });

  test('handles nature and hero units', () => {
    expect(unitIdToUnitIconMapper('RAT')).toBe('rat');
    expect(unitIdToUnitIconMapper('WOLF')).toBe('wolf');
    expect(unitIdToUnitIconMapper('HERO')).toBe('hero');
  });
});
