import { useTranslation } from 'react-i18next';
import { BsShieldFill } from 'react-icons/bs';
import { CiBag1 } from 'react-icons/ci';
import { GiSpyglass } from 'react-icons/gi';
import { LuScale, LuSword } from 'react-icons/lu';
import { PiPathBold } from 'react-icons/pi';
import type { ReportType } from '@pillage-first/types/models/report';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';

type ReportFiltersProps = {
  reportFilters: ReportType[];
  onChange: (reportFilters: ReportType[]) => void;
};

export const ReportFilters = ({
  reportFilters,
  onChange,
}: ReportFiltersProps) => {
  const { t } = useTranslation();

  return (
    <SectionContent>
      <Text className="font-semibold">{t('Filter reports')}</Text>
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
          <LuSword className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle raid reports')}
          value="raid"
        >
          <CiBag1 className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle defence reports')}
          value="defence"
        >
          <BsShieldFill className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle scouting reports')}
          value="scout-attack"
        >
          <GiSpyglass className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle scouting defence reports')}
          value="scout-defence"
        >
          <GiSpyglass className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle adventure reports')}
          value="adventure"
        >
          <PiPathBold className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle trade reports')}
          value="trade"
        >
          <LuScale className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </SectionContent>
  );
};
