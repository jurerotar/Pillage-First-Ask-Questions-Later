import { describe, expect, test } from 'vitest';
import {
  unitSpeedAfter20FieldsHeroBonusEffectMock,
  unitSpeedAfter20FieldsHugeHeroBonusEffectMock,
  unitSpeedHeroBonusEffectMock,
} from '@pillage-first/mocks/effect';
import type { Effect } from '@pillage-first/types/models/effect';
import type { Troop } from '@pillage-first/types/models/troop';
import { calculateTravelDuration } from '@pillage-first/utils/game/troop-movement-duration';
import { coordinatesToTileId } from '@pillage-first/utils/map';

describe(calculateTravelDuration, () => {
  const mapSize = 100;
  const originTileId = coordinatesToTileId({ x: 0, y: 0 }, mapSize);
  const targetTileId10FieldsAway = coordinatesToTileId(
    { x: 10, y: 0 },
    mapSize,
  );

  const defaultArgs = {
    originTileId,
    targetTileId: targetTileId10FieldsAway,
    mapSize,
    // LEGIONNAIRE speed is 6
    troops: [
      { unitId: 'LEGIONNAIRE', amount: 10, sourceTileId: 1, tileId: 1 },
    ] satisfies Troop[],
    effects: [] satisfies Effect[],
  };

  test('should calculate duration correctly for distance <= 20 with no bonuses', () => {
    const duration = calculateTravelDuration(defaultArgs);

    expect(duration).toBe(6_000_000);
  });

  test('should apply unitSpeed bonus for distance <= 20', () => {
    const duration = calculateTravelDuration({
      ...defaultArgs,
      effects: [{ ...unitSpeedHeroBonusEffectMock, tileId: originTileId }],
    });

    expect(duration).toBe(3_000_000);
  });

  test('should use the slowest unit speed', () => {
    // LEGIONNAIRE speed = 6
    // PRAETORIAN speed = 5
    // slowest = 5
    const duration = calculateTravelDuration({
      ...defaultArgs,
      troops: [
        { unitId: 'LEGIONNAIRE', amount: 10, sourceTileId: 1, tileId: 1 },
        { unitId: 'PRAETORIAN', amount: 10, sourceTileId: 1, tileId: 1 },
      ],
    });

    expect(duration).toBe(7_200_000);
  });

  test('should calculate duration correctly for distance > 20 with no bonuses', () => {
    const duration = calculateTravelDuration({
      ...defaultArgs,
      targetTileId: coordinatesToTileId({ x: 30, y: 0 }, mapSize),
    });

    expect(duration).toBe(18_000_000);
  });

  test('should apply unitSpeedAfter20Fields bonus for distance > 20', () => {
    const duration = calculateTravelDuration({
      ...defaultArgs,
      targetTileId: coordinatesToTileId({ x: 30, y: 0 }, mapSize),
      effects: [
        {
          ...unitSpeedAfter20FieldsHeroBonusEffectMock,
          tileId: originTileId,
        },
      ],
    });

    expect(duration).toBeCloseTo(15_000_000);
  });

  test('should calculate duration correctly for distance === 20', () => {
    const duration = calculateTravelDuration({
      ...defaultArgs,
      targetTileId: coordinatesToTileId({ x: 20, y: 0 }, mapSize),
    });

    expect(duration).toBe(12_000_000);
  });

  test('should apply unitSpeedAfter20Fields bonus for distance === 21', () => {
    const duration = calculateTravelDuration({
      ...defaultArgs,
      targetTileId: coordinatesToTileId({ x: 21, y: 0 }, mapSize),
      effects: [
        {
          ...unitSpeedAfter20FieldsHugeHeroBonusEffectMock,
          tileId: originTileId,
        },
      ],
    });

    expect(duration).toBeCloseTo(12_060_000);
  });

  test('should ignore local speed effects for a different origin tile id', () => {
    const duration = calculateTravelDuration({
      ...defaultArgs,
      effects: [{ ...unitSpeedHeroBonusEffectMock, tileId: originTileId + 1 }],
    });

    expect(duration).toBe(6_000_000);
  });
});
