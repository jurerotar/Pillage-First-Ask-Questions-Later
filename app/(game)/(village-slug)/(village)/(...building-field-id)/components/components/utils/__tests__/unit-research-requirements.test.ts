import { assessUnitResearchReadiness } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/utils/unit-research-requirements';
import type { Village } from 'app/interfaces/models/game/village';
import { villageMock } from 'app/tests/mocks/game/village/village-mock';
import { describe, expect, test } from 'vitest';

// TODO: Add more tests here
describe('unit-research-requirements', () => {
  test('You should not be able to research swordsman without lvl. 3 academy', () => {
    const { canResearch } = assessUnitResearchReadiness(
      'SWORDSMAN',
      villageMock,
    );
    expect(canResearch).toBeFalsy();
  });

  test('You should be able to research swordsman with lvl. 3 academy', () => {
    const village: Village = {
      ...villageMock,
      buildingFields: [{ buildingId: 'ACADEMY', id: 1, level: 3 }],
    };
    const { canResearch } = assessUnitResearchReadiness('SWORDSMAN', village);
    expect(canResearch).toBeTruthy();
  });
});
