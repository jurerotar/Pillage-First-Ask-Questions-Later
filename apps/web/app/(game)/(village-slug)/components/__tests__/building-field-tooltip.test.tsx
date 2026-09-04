// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { BuildingFieldTooltip } from 'app/(game)/(village-slug)/components/building-field-tooltip';
import { useBuildingConstructionErrorBag } from 'app/(game)/(village-slug)/hooks/use-building-construction-error-bag';
import { CurrentVillageLiveResourcesContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';

vi.mock('@pillage-first/game-assets/utils/buildings', () => ({
  getBuildingDataForLevel: () => ({
    isMaxLevel: false,
    nextLevelBuildingDuration: 60,
    nextLevelResourceCost: [100, 200, 300, 400],
  }),
}));

vi.mock(
  'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level',
  () => ({
    useBuildingVirtualLevel: () => ({
      isDowngrading: false,
      isUpgrading: false,
      virtualLevel: 1,
    }),
  }),
);

vi.mock('app/(game)/(village-slug)/hooks/use-computed-effect', () => ({
  useComputedEffect: () => ({ total: 1 }),
}));

vi.mock(
  'app/(game)/(village-slug)/hooks/use-building-construction-error-bag',
  () => ({
    useBuildingConstructionErrorBag: vi.fn(() => ({
      canUpgrade: false,
      errorBag: ['Upgrade blocked'],
      variant: 'yellow',
    })),
  }),
);

describe(BuildingFieldTooltip, () => {
  test('shows upgrade errors and highlights insufficient resources', () => {
    render(
      <CurrentVillageLiveResourcesContext
        value={{ wood: 99, clay: 200, iron: 299, wheat: 500 }}
      >
        <BuildingFieldTooltip
          buildingField={{ id: 1, buildingId: 'WOODCUTTER', level: 1 }}
        />
      </CurrentVillageLiveResourcesContext>,
    );

    expect(screen.getByText('Upgrade blocked')).toBeTruthy();
    expect(screen.getByText('100').closest('span')?.classList).toContain(
      'text-destructive',
    );
    expect(screen.getByText('200').closest('span')?.classList).not.toContain(
      'text-destructive',
    );
    expect(screen.getByText('300').closest('span')?.classList).toContain(
      'text-destructive',
    );
    expect(screen.getByText('400').closest('span')?.classList).not.toContain(
      'text-destructive',
    );
    expect(useBuildingConstructionErrorBag).toHaveBeenCalledWith(
      'WOODCUTTER',
      1,
      1,
    );
  });
});
