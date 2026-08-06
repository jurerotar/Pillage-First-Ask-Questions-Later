import { describe, expect, test } from 'vitest';
import { TRIBES } from '@pillage-first/types/models/tribe';
import { buildings } from '../buildings';

const buildingEffectCases = buildings.flatMap(({ id, maxLevel, effects }) =>
  TRIBES.flatMap((tribe) =>
    effects(tribe).map((effect) => ({
      buildingId: id,
      tribe,
      effect,
      expectedLength: maxLevel + 1,
    })),
  ),
);

describe('building assets', () => {
  test.each(buildingEffectCases)(
    "effect '$effect.effectId' in $buildingId has values for each building level",
    ({ buildingId, tribe, effect, expectedLength }) => {
      expect(
        effect.valuesPerLevel,
        `Effect '${effect.effectId}' in ${buildingId} for ${tribe} has incorrect length (expected ${expectedLength}, got ${effect.valuesPerLevel.toString()})`,
      ).toHaveLength(expectedLength);
    },
  );
});
