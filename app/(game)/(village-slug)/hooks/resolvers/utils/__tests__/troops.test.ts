import { describe, expect, test } from 'vitest';
import type { Troop } from 'app/interfaces/models/game/troop';
import { canSendTroops, modifyTroops } from '../troops';

describe('canSendTroops', () => {
  test('returns true when enough matching troops exist', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 100, tileId: '0|0', source: '0|0' }];
    const toSend: Troop[] = [{ unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|0' }];

    expect(canSendTroops(base, toSend)).toBe(true);
  });

  test('returns false when not enough troops available', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 40, tileId: '0|0', source: '0|0' }];
    const toSend: Troop[] = [{ unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|0' }];

    expect(canSendTroops(base, toSend)).toBe(false);
  });

  test('returns true when sources differ but still valid amounts', () => {
    const base: Troop[] = [
      { unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|0' },
      { unitId: 'PHALANX', amount: 30, tileId: '0|0', source: '0|1' },
    ];
    const toSend: Troop[] = [{ unitId: 'PHALANX', amount: 30, tileId: '0|0', source: '0|1' }];

    expect(canSendTroops(base, toSend)).toBe(true);
  });

  test('returns false when key doesn’t exist in base', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 60, tileId: '0|0', source: '0|0' }];
    const toSend: Troop[] = [{ unitId: 'PHALANX', amount: 10, tileId: '0|0', source: '1|0' }];

    expect(() => canSendTroops(base, toSend)).toThrow();
  });
});

describe('modifyTroops', () => {
  test('adds amount to existing troop', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 100, tileId: '0|0', source: '0|0' }];
    const incoming: Troop[] = [{ unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|0' }];

    const result = modifyTroops(base, incoming, 'add');
    expect(result).toEqual([{ unitId: 'PHALANX', amount: 150, tileId: '0|0', source: '0|0' }]);
  });

  test('adds troop with different source as separate entry', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 100, tileId: '0|0', source: '0|0' }];
    const incoming: Troop[] = [{ unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|1' }];

    const result = modifyTroops(base, incoming, 'add');
    expect(result).toContainEqual({ unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|1' });
  });

  test('subtracts amount from troop', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 80, tileId: '0|0', source: '0|0' }];
    const subtract: Troop[] = [{ unitId: 'PHALANX', amount: 30, tileId: '0|0', source: '0|0' }];

    const result = modifyTroops(base, subtract, 'subtract');
    expect(result).toEqual([{ unitId: 'PHALANX', amount: 50, tileId: '0|0', source: '0|0' }]);
  });

  test('removes troop if amount reaches zero', () => {
    const base: Troop[] = [{ unitId: 'PHALANX', amount: 30, tileId: '0|0', source: '0|0' }];
    const subtract: Troop[] = [{ unitId: 'PHALANX', amount: 30, tileId: '0|0', source: '0|0' }];

    const result = modifyTroops(base, subtract, 'subtract');
    expect(result).toEqual([]);
  });
});
