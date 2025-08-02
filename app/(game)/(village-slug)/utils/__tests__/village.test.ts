import { describe, expect, test } from 'vitest';
import { getVillageName } from 'app/(game)/(village-slug)/utils/village';
import {
  npcVillageNameNouns,
  npcVillageNameAdjectives,
} from 'app/assets/village';

describe('getVillageName', () => {
  test('decodes packed index with adjectiveIndex = 0 and nounIndex = 0', () => {
    const code = 0 * npcVillageNameNouns.length + 0;
    expect(getVillageName(code)).toBe(
      `${npcVillageNameAdjectives[0]}${npcVillageNameNouns[0]}`,
    );
  });

  test('decodes packed index with mid-range adjective and noun indices', () => {
    const adjectiveIndex = 5;
    const nounIndex = 7;
    const code = adjectiveIndex * npcVillageNameNouns.length + nounIndex;
    expect(getVillageName(code)).toBe(
      `${npcVillageNameAdjectives[5]}${npcVillageNameNouns[7]}`,
    );
  });

  test('decodes last valid combination correctly', () => {
    const lastAdjective = npcVillageNameAdjectives.length - 1;
    const lastNoun = npcVillageNameNouns.length - 1;
    const code = lastAdjective * npcVillageNameNouns.length + lastNoun;
    expect(getVillageName(code)).toBe(
      `${npcVillageNameAdjectives[lastAdjective]}${npcVillageNameNouns[lastNoun]}`,
    );
  });

  test('decodes edge index: last adjective with first noun', () => {
    const code =
      (npcVillageNameAdjectives.length - 1) * npcVillageNameNouns.length + 0;
    expect(getVillageName(code)).toBe(
      `${npcVillageNameAdjectives[npcVillageNameAdjectives.length - 1]}${npcVillageNameNouns[0]}`,
    );
  });

  test('decodes edge index: first adjective with last noun', () => {
    const code =
      0 * npcVillageNameNouns.length + (npcVillageNameNouns.length - 1);
    expect(getVillageName(code)).toBe(
      `${npcVillageNameAdjectives[0]}${npcVillageNameNouns[npcVillageNameNouns.length - 1]}`,
    );
  });
});
