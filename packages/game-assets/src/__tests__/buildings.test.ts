import { describe, expect, test } from 'vitest';
import { buildings } from '../buildings';

const buildingEffectCases = buildings.flatMap(({ id, maxLevel, effects }) =>
  effects.map((effect) => ({
    buildingId: id,
    effect,
    expectedLength: maxLevel + 1,
  })),
);

describe('building assets', () => {
  test.each(
    buildingEffectCases,
  )("effect '$effect.effectId' in $buildingId has values for each building level", ({
    buildingId,
    effect,
    expectedLength,
  }) => {
    expect(
      effect.valuesPerLevel,
      `Effect '${effect.effectId}' in ${buildingId} has incorrect length (expected ${expectedLength}, got ${effect.valuesPerLevel.toString()})`,
    ).toHaveLength(expectedLength);
  });
});
