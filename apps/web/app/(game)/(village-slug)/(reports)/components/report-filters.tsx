import { useTranslation } from 'react-i18next';
import { LuScale, LuSword } from 'react-icons/lu';
import { PiPathBold, PiSignpostBold } from 'react-icons/pi';
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
          data-tooltip-content={t('Toggle movement reports')}
          value="movement"
        >
          <PiSignpostBold className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle battle reports')}
          value="battle"
        >
          <LuSword className="size-4" />
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
