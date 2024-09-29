import { assessUnitResearchReadiness } from 'app/[game]/[village]/[...building-field-id]/components/components/utils/unit-research-requirements';
import type { Village } from 'interfaces/models/game/village';
import { villageMock } from 'mocks/game/village/village-mock';
import { describe, expect, test } from 'vitest';

// TODO: Add more tests here
describe('unit-research-requirements', () => {
  test('You should not be able to research swordsman without lvl. 3 academy', () => {
    const { canResearch } = assessUnitResearchReadiness('SWORDSMAN', villageMock);
    expect(canResearch).toBe(false);
  });

  test('You should be able to research swordsman with lvl. 3 academy', () => {
    const village: Village = { ...villageMock, buildingFields: [{ buildingId: 'ACADEMY', id: 1, level: 3 }] };
    const { canResearch } = assessUnitResearchReadiness('SWORDSMAN', village);
    expect(canResearch).toBe(true);
  });
});
