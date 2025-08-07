import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';
import type { ReportType } from 'app/interfaces/models/game/report';
import type React from 'react';
import { useTranslation } from 'react-i18next';

type ReportFiltersProps = {
  reportFilters: ReportType[];
  onChange: (reportFilters: ReportType[]) => void;
};

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  reportFilters,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <ToggleGroup
      type="multiple"
      value={reportFilters}
      onValueChange={onChange}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle attack reports')}
        value="attack"
      >
        <i className="icon icon-[lu-swords] size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle raid reports')}
        value="raid"
      >
        <i className="icon icon-[ci-bag1] size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle defence reports')}
        value="defence"
      >
        <i className="icon icon-[bs-shield-fill] size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle scouting reports')}
        value="scout-attack"
      >
        <i className="icon icon-[gi-spyglass] size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle scouting defence reports')}
        value="scout-defence"
      >
        <i className="icon icon-[gi-spyglass] size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle adventure reports')}
        value="adventure"
      >
        <i className="icon icon-[pi-path-bold] size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle trade reports')}
        value="trade"
      >
        <i className="icon icon-[lu-scale] size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
