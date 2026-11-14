import { describe, expect, test } from 'vitest';
import type { BattleUnit } from '@pillage-first/types/models/battle';
import { canAttackerSeeDefendingTroops } from '../combat';

const unit = (overrides: Partial<BattleUnit> = {}): BattleUnit => ({
  unitId: 'LEGIONNAIRE',
  amountBefore: 100,
  amountAfter: 0,
  amountHospitalized: 0,
  amountImprisoned: 0,
  amountBandaged: 0,
  amountConsumed: 0,
  ...overrides,
});

describe(canAttackerSeeDefendingTroops, () => {
  test('reveals defenders when an attacker survives', () => {
    const attackers = [unit({ amountAfter: 1 })];
    const defenders = [unit({ amountAfter: 100 })];

    expect(canAttackerSeeDefendingTroops(attackers, defenders)).toBe(true);
  });

  test('reveals defenders at exactly 25 percent killed', () => {
    const defenders = [unit({ amountAfter: 75 })];

    expect(canAttackerSeeDefendingTroops([unit()], defenders)).toBe(true);
  });

  test('hides defenders below 25 percent killed with no returning attackers', () => {
    const defenders = [unit({ amountAfter: 76 })];

    expect(canAttackerSeeDefendingTroops([unit()], defenders)).toBe(false);
  });

  test('counts reinforcing troops in the defending army', () => {
    const defenders = [unit(), unit({ amountBefore: 400, amountAfter: 400 })];

    expect(canAttackerSeeDefendingTroops([unit()], defenders)).toBe(false);
  });

  test('hides defenders when every attacker is trapped', () => {
    const attackers = [
      unit({ amountImprisoned: 100 }),
      unit({ unitId: 'HERO', amountBefore: 1, amountImprisoned: 1 }),
    ];

    expect(canAttackerSeeDefendingTroops(attackers, [unit()])).toBe(false);
    expect(canAttackerSeeDefendingTroops(attackers, [])).toBe(false);
  });

  test('allows a survivor to reveal defenders despite other trapped troops', () => {
    const attackers = [unit({ amountImprisoned: 99, amountAfter: 1 })];

    expect(
      canAttackerSeeDefendingTroops(attackers, [unit({ amountAfter: 100 })]),
    ).toBe(true);
  });

  test('does not count recovered or captured defenders as killed', () => {
    const defenders = [
      unit({
        amountAfter: 60,
        amountHospitalized: 10,
        amountBandaged: 10,
        amountImprisoned: 10,
      }),
    ];

    expect(canAttackerSeeDefendingTroops([unit()], defenders)).toBe(false);
  });

  test('does not reveal empty defenses when no attacker returns', () => {
    expect(canAttackerSeeDefendingTroops([unit()], [])).toBe(false);
    expect(canAttackerSeeDefendingTroops([], [])).toBe(false);
  });
});
