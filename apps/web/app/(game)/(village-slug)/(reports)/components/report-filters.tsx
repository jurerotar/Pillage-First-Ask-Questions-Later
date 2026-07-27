import { useTranslation } from 'react-i18next';
import {
  LuArrowLeftRight,
  LuEye,
  LuScale,
  LuShieldCheck,
  LuSword,
} from 'react-icons/lu';
import { PiPathBold, PiSignpostBold } from 'react-icons/pi';
import type { ReportListingFilter } from '@pillage-first/types/dtos/report';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';

type ReportFiltersProps = {
  reportFilters: ReportListingFilter[];
  onChange: (reportFilters: ReportListingFilter[]) => void;
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
          data-tooltip-content={t('Toggle scouting reports')}
          value="scouting"
        >
          <LuEye className="size-4" />
        </ToggleGroupItem>
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
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle hunting party reports')}
          value="huntingParty"
        >
          <Icon
            className="size-4 !text-current"
            type="huntingParty"
          />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle gathering expedition reports')}
          value="gatheringExpedition"
        >
          <Icon
            className="size-4 !text-current"
            type="gatheringExpedition"
          />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t(
            'Toggle combat reports in which you lost no troops',
          )}
          value="noLoss"
        >
          <LuShieldCheck className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t(
            "Toggle trade reports between the player's own villages",
          )}
          value="ownTrades"
        >
          <LuArrowLeftRight className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </SectionContent>
  );
};
