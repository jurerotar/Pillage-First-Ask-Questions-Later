import { describe, expect, test } from 'vitest';
import { getValidScheduledConstructionDropTargetIds } from 'app/(game)/(village-slug)/hooks/use-construction-queue-drag';
import type { ScheduledBuildingUpgrade } from 'app/(game)/(village-slug)/hooks/use-scheduled-building-upgrades';

const scheduledUpgrade = (
  override: Partial<ScheduledBuildingUpgrade> &
    Pick<
      ScheduledBuildingUpgrade,
      'buildingFieldId' | 'id' | 'level' | 'previousLevel'
    >,
): ScheduledBuildingUpgrade => ({
  buildingId: 'WOODCUTTER',
  type: 'scheduledBuildingUpgrade',
  villageId: 1,
  ...override,
});

const getValidDropTargetIds = (
  upgrades: ScheduledBuildingUpgrade[],
  draggedId: number | null,
) =>
  [...getValidScheduledConstructionDropTargetIds(upgrades, draggedId)].sort(
    (a, b) => a - b,
  );

describe(getValidScheduledConstructionDropTargetIds, () => {
  test('returns no targets when no scheduled upgrade is being dragged', () => {
    expect(
      getValidDropTargetIds(
        [
          scheduledUpgrade({
            buildingFieldId: 1,
            id: 1,
            level: 2,
            previousLevel: 1,
          }),
        ],
        null,
      ),
    ).toEqual([]);
  });

  test('marks all other slots valid when moving between unrelated building fields', () => {
    const upgrades = [
      scheduledUpgrade({
        buildingFieldId: 1,
        id: 1,
        level: 2,
        previousLevel: 1,
      }),
      scheduledUpgrade({
        buildingFieldId: 2,
        id: 2,
        level: 2,
        previousLevel: 1,
      }),
      scheduledUpgrade({
        buildingFieldId: 3,
        id: 3,
        level: 2,
        previousLevel: 1,
      }),
    ];

    expect(getValidDropTargetIds(upgrades, 1)).toEqual([2, 3]);
  });

  test('does not allow moving a higher same-field level before a lower same-field level', () => {
    const upgrades = [
      scheduledUpgrade({
        buildingFieldId: 1,
        id: 1,
        level: 2,
        previousLevel: 1,
      }),
      scheduledUpgrade({
        buildingFieldId: 1,
        id: 2,
        level: 3,
        previousLevel: 2,
      }),
    ];

    expect(getValidDropTargetIds(upgrades, 2)).toEqual([]);
  });

  test('allows moving a lower same-field level as long as it stays before higher same-field levels', () => {
    const upgrades = [
      scheduledUpgrade({
        buildingFieldId: 1,
        id: 1,
        level: 2,
        previousLevel: 1,
      }),
      scheduledUpgrade({
        buildingFieldId: 2,
        id: 2,
        level: 2,
        previousLevel: 1,
      }),
      scheduledUpgrade({
        buildingFieldId: 1,
        id: 3,
        level: 3,
        previousLevel: 2,
      }),
      scheduledUpgrade({
        buildingFieldId: 3,
        id: 4,
        level: 2,
        previousLevel: 1,
      }),
    ];

    expect(getValidDropTargetIds(upgrades, 1)).toEqual([2]);
  });
});
