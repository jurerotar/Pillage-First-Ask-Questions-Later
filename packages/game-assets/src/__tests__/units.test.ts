import { describe, expect, test } from 'vitest';
import { units } from '../units';

const getBuildingIds = (unit: (typeof units)[number]) =>
  unit.researchRequirements.map((r) => r.buildingId);

describe('unit validation rules', () => {
  test('tier-1 and SETTLER units must not have researchRequirements', () => {
    const invalidUnits = units.filter(
      (unit) =>
        (unit.tier === 'tier-1' || unit.id.includes('SETTLER')) &&
        unit.researchRequirements.length > 0,
    );
    expect(invalidUnits).toStrictEqual([]);
  });

  test('chief and settler units must be category "special" and tier "special"', () => {
    const invalidUnits = units.filter(
      (unit) =>
        (unit.id.includes('SETTLER') || unit.id.includes('CHIEF')) &&
        (unit.category !== 'special' || unit.tier !== 'special'),
    );
    expect(invalidUnits).toStrictEqual([]);
  });

  test('catapult and ram units must be category "siege"', () => {
    const invalidUnits = units.filter(
      (unit) =>
        (unit.id.includes('RAM') || unit.id.includes('CATAPULT')) &&
        unit.category !== 'siege',
    );
    expect(invalidUnits).toStrictEqual([]);
  });

  test('sCOUT units must have tier "scout"', () => {
    const invalidUnits = units.filter(
      (unit) => unit.id.includes('SCOUT') && unit.tier !== 'scout',
    );
    expect(invalidUnits).toStrictEqual([]);
  });

  test('cavalry units must require both ACADEMY and STABLE', () => {
    const invalidUnits = units.filter((unit) => {
      if (unit.category !== 'cavalry') {
        return false;
      }
      const buildings = getBuildingIds(unit);
      return !buildings.includes('ACADEMY') || !buildings.includes('STABLE');
    });
    expect(invalidUnits).toStrictEqual([]);
  });

  test('rAM and CATAPULT units must require WORKSHOP', () => {
    const invalidUnits = units.filter((unit) => {
      if (!unit.id.includes('RAM') && !unit.id.includes('CATAPULT')) {
        return false;
      }
      const buildings = getBuildingIds(unit);
      return !buildings.includes('WORKSHOP');
    });
    expect(invalidUnits).toStrictEqual([]);
  });
});
