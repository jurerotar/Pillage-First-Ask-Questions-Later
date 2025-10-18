import { describe, test, expect } from 'vitest';
import { units } from 'app/assets/units';

const getBuildingIds = (unit: (typeof units)[number]) =>
  unit.researchRequirements.map((r) => r.buildingId);

describe('Unit validation rules', () => {
  test('Tier-1 and SETTLER units must not have researchRequirements', () => {
    const invalidUnits = units.filter(
      (unit) =>
        (unit.tier === 'tier-1' || unit.id.includes('SETTLER')) &&
        unit.researchRequirements.length > 0,
    );
    expect(invalidUnits).toStrictEqual([]);
  });

  test('CHIEF and SETTLER units must be category "special" and tier "special"', () => {
    const invalidUnits = units.filter(
      (unit) =>
        (unit.id.includes('SETTLER') || unit.id.includes('CHIEF')) &&
        (unit.category !== 'special' || unit.tier !== 'special'),
    );
    expect(invalidUnits).toStrictEqual([]);
  });

  test('CATAPULT and RAM units must be category "siege"', () => {
    const invalidUnits = units.filter(
      (unit) =>
        (unit.id.includes('RAM') || unit.id.includes('CATAPULT')) &&
        unit.category !== 'siege',
    );
    expect(invalidUnits).toStrictEqual([]);
  });

  test('SCOUT units must have tier "scout"', () => {
    const invalidUnits = units.filter(
      (unit) => unit.id.includes('SCOUT') && unit.tier !== 'scout',
    );
    expect(invalidUnits).toStrictEqual([]);
  });

  test('Cavalry units must require both ACADEMY and STABLE', () => {
    const invalidUnits = units.filter((unit) => {
      if (unit.category !== 'cavalry') {
        return false;
      }
      const buildings = getBuildingIds(unit);
      return !buildings.includes('ACADEMY') || !buildings.includes('STABLE');
    });
    expect(invalidUnits).toStrictEqual([]);
  });

  test('RAM and CATAPULT units must require WORKSHOP', () => {
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
