import { describe, expect, test } from 'vitest';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import {
  unitSpeedAfter20FieldsHeroBonusEffectMock,
  unitSpeedHeroBonusEffectMock,
} from '@pillage-first/mocks/effect';
import type { Effect } from '@pillage-first/types/models/effect';
import type { Troop } from '@pillage-first/types/models/troop';
import type { Village } from '@pillage-first/types/models/village';
import { coordinatesToTileId } from '../../map';
import { calculateTravelDuration } from '../troop-movement-duration';

const origin: Village['coordinates'] = { x: 0, y: 0 };
const mapSize = 100;
const originTileId = coordinatesToTileId(origin, mapSize);

describe(calculateTravelDuration, () => {
  test('uses the slowest unit speed when multiple troops are sent (<= 20 tiles, no effects)', () => {
    const target: Village['coordinates'] = { x: 10, y: 0 };

    const romans = getUnitsByTribe('romans');
    const [firstRoman, ...remainingRomans] = romans;

    if (!firstRoman) {
      throw new Error('Expected roman units to exist');
    }

    let slowest = firstRoman;
    let fastest = firstRoman;

    for (const roman of remainingRomans) {
      if (roman.unitSpeed < slowest.unitSpeed) {
        slowest = roman;
      }

      if (roman.unitSpeed > fastest.unitSpeed) {
        fastest = roman;
      }
    }

    const troops: Troop[] = [
      { unitId: fastest.id, amount: 1, tileId: 0, sourceTileId: 0 },
      { unitId: slowest.id, amount: 1, tileId: 0, sourceTileId: 0 },
    ];

    const effects: Effect[] = [];

    const expectedMs = (10 / slowest.unitSpeed) * 3_600_000;

    const ms = calculateTravelDuration({
      originTileId,
      targetTileId: coordinatesToTileId(target, mapSize),
      mapSize,
      troops,
      effects,
    });

    expect(ms).toBeCloseTo(expectedMs, 6);
  });

  test('applies unitSpeed bonus for distances <= 20 tiles', () => {
    const target: Village['coordinates'] = { x: 20, y: 0 };

    const romans = getUnitsByTribe('romans');
    const [unit] = romans;

    const troops: Troop[] = [
      {
        unitId: unit.id,
        amount: 1,
        tileId: 0,
        sourceTileId: 0,
      },
    ];
    const effects: Effect[] = [
      { ...unitSpeedHeroBonusEffectMock, tileId: originTileId },
    ];

    const { unitSpeed } = getUnitDefinition(unit.id);
    const expectedMs =
      (20 / (unitSpeed * unitSpeedHeroBonusEffectMock.value)) * 3_600_000;

    const ms = calculateTravelDuration({
      originTileId,
      targetTileId: coordinatesToTileId(target, mapSize),
      mapSize,
      troops,
      effects,
    });

    expect(ms).toBeCloseTo(expectedMs, 6);
  });

  test('applies piecewise speed: <=20 with unitSpeed, remaining with unitSpeedAfter20Fields', () => {
    const target: Village['coordinates'] = { x: 50, y: 0 };

    const romans = getUnitsByTribe('romans');
    const [unit] = romans;

    const troops: Troop[] = [
      {
        unitId: unit.id,
        amount: 1,
        tileId: 0,
        sourceTileId: 0,
      },
    ];
    const effects: Effect[] = [
      { ...unitSpeedHeroBonusEffectMock, tileId: originTileId },
      {
        ...unitSpeedAfter20FieldsHeroBonusEffectMock,
        tileId: originTileId,
      },
    ];

    const { unitSpeed } = getUnitDefinition(unit.id);
    const speedFirst20Fields = unitSpeed * unitSpeedHeroBonusEffectMock.value;
    const speedAfter20Fields =
      speedFirst20Fields * unitSpeedAfter20FieldsHeroBonusEffectMock.value;
    const expectedMs =
      (20 / speedFirst20Fields + 30 / speedAfter20Fields) * 3_600_000;

    const ms = calculateTravelDuration({
      originTileId,
      targetTileId: coordinatesToTileId(target, mapSize),
      mapSize,
      troops,
      effects,
    });

    expect(ms).toBeCloseTo(expectedMs, 6);
  });

  test('matches local speed effects by origin tile id, not village id', () => {
    const target: Village['coordinates'] = { x: 20, y: 0 };
    const [unit] = getUnitsByTribe('romans');
    const effect: Effect = {
      ...unitSpeedHeroBonusEffectMock,
      tileId: originTileId,
    };

    const ms = calculateTravelDuration({
      originTileId,
      targetTileId: coordinatesToTileId(target, mapSize),
      mapSize,
      troops: [{ unitId: unit.id, amount: 1, tileId: 0, sourceTileId: 0 }],
      effects: [effect],
    });

    const { unitSpeed } = getUnitDefinition(unit.id);
    const expectedMs = (20 / (unitSpeed * effect.value)) * 3_600_000;

    expect(ms).toBeCloseTo(expectedMs, 6);
  });
});
