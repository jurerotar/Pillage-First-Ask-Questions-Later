import { useTranslation } from 'react-i18next';
import { AiOutlineExpandAlt, AiOutlineShrink } from 'react-icons/ai';
import type { BuildingConstructionViewMode } from '@pillage-first/types/models/preferences';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';

export const BuildingConstructionViewModeToggle = () => {
  const { t } = useTranslation();
  const { preferences, updatePreference } = usePreferences();
  const viewMode = preferences.buildingConstructionViewMode;

  return (
    <ToggleGroup
      variant="outline"
      type="single"
      value={viewMode}
      onValueChange={(value: BuildingConstructionViewMode) => {
        updatePreference({
          preferenceName: 'buildingConstructionViewMode',
          value,
        });
      }}
    >
      <ToggleGroupItem
        value="detailed"
        aria-label={t('Detailed view')}
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Detailed view')}
        disabled={viewMode === 'detailed'}
      >
        <AiOutlineExpandAlt />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="compact"
        aria-label={t('Compact view')}
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Compact view')}
        disabled={viewMode === 'compact'}
      >
        <AiOutlineShrink />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
