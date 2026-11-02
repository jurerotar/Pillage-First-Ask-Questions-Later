import { describe, expect, test } from 'vitest';
import { allocateHeroAttributePoints } from '../hero-attribute-points';

const minimum = {
  attackPower: 0,
  resourceProduction: 0,
  attackBonus: 0,
  defenceBonus: 0,
};

describe(allocateHeroAttributePoints, () => {
  test('repeated drag events cannot spend more than the available budget', () => {
    let attributes = minimum;

    for (const value of [2, 3, 50, 100, 100]) {
      attributes = allocateHeroAttributePoints(
        attributes,
        minimum,
        4,
        'attackPower',
        value,
      );
    }

    expect(attributes.attackPower).toBe(4);
    expect(
      allocateHeroAttributePoints(attributes, minimum, 4, 'attackBonus', 100),
    ).toEqual(attributes);
  });

  test('decreasing an allocation makes its points available to another attribute', () => {
    const attributes = { ...minimum, attackPower: 4 };

    const reduced = allocateHeroAttributePoints(
      attributes,
      minimum,
      4,
      'attackPower',
      2,
    );

    expect(
      allocateHeroAttributePoints(reduced, minimum, 4, 'attackBonus', 100),
    ).toEqual({ ...minimum, attackPower: 2, attackBonus: 2 });
  });

  test('respects saved allocations and the per-attribute cap', () => {
    const saved = { ...minimum, attackPower: 10 };

    expect(
      allocateHeroAttributePoints(saved, saved, 200, 'attackPower', 0),
    ).toEqual(saved);
    expect(
      allocateHeroAttributePoints(saved, saved, 200, 'attackPower', 200)
        .attackPower,
    ).toBe(100);
  });
});
