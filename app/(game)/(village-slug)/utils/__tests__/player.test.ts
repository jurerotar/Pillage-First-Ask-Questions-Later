import { describe, expect, test } from 'vitest';
import { getPlayerName } from 'app/(game)/(village-slug)/utils/player';
import { usernameRoots } from 'app/assets/player';

describe('getPlayerName', () => {
  test('returns string as-is if input is already a name', () => {
    expect(getPlayerName('EpicFarticus#1234')).toBe('EpicFarticus#1234');
  });

  test('decodes numeric code into name using usernameRoots and padded ID', () => {
    // rootIndex = 0 → SnailWarlord, id = 42 → 0042
    const code = 0 * 10000 + 42;
    expect(getPlayerName(code)).toBe('SnailWarlord#0042');
  });

  test('handles mid-range usernameRoots index', () => {
    // rootIndex = 25 → WafflePaladin, id = 777
    const code = 25 * 10000 + 777;
    expect(getPlayerName(code)).toBe('WafflePaladin#0777');
  });

  test('uses last index of usernameRoots correctly', () => {
    const lastIndex = usernameRoots.length - 1; // 99
    const code = lastIndex * 10000 + 1; // should decode to 'EmoCentaur#0001'
    expect(getPlayerName(code)).toBe('EmoCentaur#0001');
  });

  test('pads id with leading zeros to 4 digits', () => {
    const code = 10 * 10000 + 7; // GoblinCEO#0007
    expect(getPlayerName(code)).toBe('GoblinCEO#0007');
  });
});
