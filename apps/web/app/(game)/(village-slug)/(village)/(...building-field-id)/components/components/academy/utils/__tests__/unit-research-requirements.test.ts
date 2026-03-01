import { describe, expect, test } from 'vitest';
import { villageMock } from '@pillage-first/mocks/village';
import type { Village } from '@pillage-first/types/models/village';
import { assessUnitResearchReadiness } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/academy/utils/unit-research-requirements';

// TODO: Add more tests here
describe('unit-research-requirements', () => {
  test('should not be able to research swordsman without lvl. 3 academy', () => {
    const { canResearch } = assessUnitResearchReadiness(
      'SWORDSMAN',
      villageMock,
    );
    expect(canResearch).toBeFalsy();
  });

  test('should be able to research swordsman with lvl. 3 academy', () => {
    const village: Village = {
      ...villageMock,
      buildingFields: [{ buildingId: 'ACADEMY', id: 1, level: 3 }],
    };
    const { canResearch } = assessUnitResearchReadiness('SWORDSMAN', village);
    expect(canResearch).toBeTruthy();
  });
});
