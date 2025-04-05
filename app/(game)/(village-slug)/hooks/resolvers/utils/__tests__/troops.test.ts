import { describe, expect, test } from 'vitest';
import type { Troop } from 'app/interfaces/models/game/troop';
import { addTroops, subtractTroops } from '../troops';

describe('addTroops', () => {
  test('should add amount to existing troop if tileId, unitId, and source match', () => {
    const existing: Troop[] = [{ unitId: 'PHALANX', amount: 100, tileId: '0|0', source: '0|0' }];
    const incoming: Troop[] = [{ unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|0' }];

    const result = addTroops([...existing], incoming);
    expect(result).toEqual([{ unitId: 'PHALANX', amount: 150, tileId: '0|0', source: '0|0' }]);
  });

  test('should push new troop if source is different', () => {
    const existing: Troop[] = [{ unitId: 'PHALANX', amount: 100, tileId: '0|0', source: '0|0' }];
    const incoming: Troop[] = [{ unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|1' }];

    const result = addTroops([...existing], incoming);
    expect(result).toEqual([
      { unitId: 'PHALANX', amount: 100, tileId: '0|0', source: '0|0' },
      { unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|1' },
    ]);
  });

  test('should push new troop if tileId is different', () => {
    const existing: Troop[] = [{ unitId: 'PHALANX', amount: 100, tileId: '0|0', source: '0|0' }];
    const incoming: Troop[] = [{ unitId: 'PHALANX', amount: 30, tileId: '0|1', source: '0|0' }];

    const result = addTroops([...existing], incoming);
    expect(result).toEqual([
      { unitId: 'PHALANX', amount: 100, tileId: '0|0', source: '0|0' },
      { unitId: 'PHALANX', amount: 30, tileId: '0|1', source: '0|0' },
    ]);
  });
});

describe('subtractTroops', () => {
  test('should subtract amount if source is same and flag is false', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 100, tileId: '0|0', source: '0|0' }];
    const toSubtract: Troop[] = [{ unitId: 'PHALANX', amount: 30, tileId: '0|0', source: '0|0' }];

    const result = subtractTroops([...base], toSubtract, false);
    expect(result).toEqual([{ unitId: 'PHALANX', amount: 70, tileId: '0|0', source: '0|0' }]);
  });

  test('should subtract amount if source is different and flag is true', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 80, tileId: '0|0', source: '0|0' }];
    const toSubtract: Troop[] = [{ unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|1' }];

    const result = subtractTroops([...base], toSubtract, true);
    expect(result).toEqual([{ unitId: 'PHALANX', amount: 30, tileId: '0|0', source: '0|0' }]);
  });

  test('should remove troop if amount reaches zero', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|0' }];
    const toSubtract: Troop[] = [{ unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|0' }];

    const result = subtractTroops([...base], toSubtract, false);
    expect(result).toEqual([]);
  });

  test('should ignore mismatched sources when flag is false', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 60, tileId: '0|0', source: '0|0' }];
    const toSubtract: Troop[] = [{ unitId: 'PHALANX', amount: 30, tileId: '0|0', source: '0|1' }];

    const result = subtractTroops([...base], toSubtract, false);
    expect(result).toEqual([
      { unitId: 'PHALANX', amount: 60, tileId: '0|0', source: '0|0' }, // unchanged
    ]);
  });

  test('should ignore mismatched sources when flag is true (same source)', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 60, tileId: '0|0', source: '0|0' }];
    const toSubtract: Troop[] = [{ unitId: 'PHALANX', amount: 30, tileId: '0|0', source: '0|0' }];

    const result = subtractTroops([...base], toSubtract, true);
    expect(result).toEqual([
      { unitId: 'PHALANX', amount: 60, tileId: '0|0', source: '0|0' }, // unchanged
    ]);
  });
});
