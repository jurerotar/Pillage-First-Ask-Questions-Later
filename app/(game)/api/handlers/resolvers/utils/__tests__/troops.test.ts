import { describe, expect, test } from 'vitest';
import type { Troop } from 'app/interfaces/models/game/troop';
import { modifyTroops } from '../troops';

describe('modifyTroops', () => {
  test('adds amount to existing troop', () => {
    const base: Troop[] = [
      { unitId: 'PHALANX', amount: 100, tileId: 0, source: 0 },
    ];
    const incoming: Troop[] = [
      { unitId: 'PHALANX', amount: 50, tileId: 0, source: 0 },
    ];

    const result = modifyTroops(base, incoming, 'add');
    expect(result).toStrictEqual([
      { unitId: 'PHALANX', amount: 150, tileId: 0, source: 0 },
    ]);
  });

  test('adds troop with different source as separate entry', () => {
    const base: Troop[] = [
      { unitId: 'PHALANX', amount: 100, tileId: 0, source: 0 },
    ];
    const incoming: Troop[] = [
      { unitId: 'PHALANX', amount: 50, tileId: 0, source: 1 },
    ];

    const result = modifyTroops(base, incoming, 'add');
    expect(result).toContainEqual({
      unitId: 'PHALANX',
      amount: 50,
      tileId: 0,
      source: 1,
    });
  });

  test('subtracts amount from troop', () => {
    const base: Troop[] = [
      { unitId: 'PHALANX', amount: 80, tileId: 0, source: 0 },
    ];
    const subtract: Troop[] = [
      { unitId: 'PHALANX', amount: 30, tileId: 0, source: 0 },
    ];

    const result = modifyTroops(base, subtract, 'subtract');
    expect(result).toStrictEqual([
      { unitId: 'PHALANX', amount: 50, tileId: 0, source: 0 },
    ]);
  });

  test('removes troop if amount reaches zero', () => {
    const base: Troop[] = [
      { unitId: 'PHALANX', amount: 30, tileId: 0, source: 0 },
    ];
    const subtract: Troop[] = [
      { unitId: 'PHALANX', amount: 30, tileId: 0, source: 0 },
    ];

    const result = modifyTroops(base, subtract, 'subtract');
    expect(result).toStrictEqual([]);
  });
});
