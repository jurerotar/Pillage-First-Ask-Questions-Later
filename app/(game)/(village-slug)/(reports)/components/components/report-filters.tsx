import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';
import type { ReportType } from 'app/interfaces/models/game/report';
import type React from 'react';
import { CiBag1 } from 'react-icons/ci';
import { LuScale, LuSwords } from 'react-icons/lu';
import { GiSpyglass } from 'react-icons/gi';
import { BsShieldFill } from 'react-icons/bs';
import { PiPathBold } from 'react-icons/pi';
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
        <LuSwords />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle raid reports')}
        value="raid"
      >
        <CiBag1 />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle defence reports')}
        value="defence"
      >
        <BsShieldFill />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle scouting reports')}
        value="scout-attack"
      >
        <GiSpyglass />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle scouting defence reports')}
        value="scout-defence"
      >
        <GiSpyglass />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle adventure reports')}
        value="adventure"
      >
        <PiPathBold />
      </ToggleGroupItem>
      <ToggleGroupItem
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t('Toggle trade reports')}
        value="trade"
      >
        <LuScale />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
