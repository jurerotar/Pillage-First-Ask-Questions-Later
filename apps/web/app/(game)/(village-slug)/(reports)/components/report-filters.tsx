import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LuArrowLeftRight,
  LuListFilter,
  LuScale,
  LuShieldCheck,
  LuSword,
} from 'react-icons/lu';
import { PiPathBold, PiSignpostBold } from 'react-icons/pi';
import type { ReportListingFilter } from '@pillage-first/types/dtos/report';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Badge } from 'app/components/ui/badge';
import { Button } from 'app/components/ui/button';
import { Checkbox } from 'app/components/ui/checkbox';
import { Label } from 'app/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';
import { Separator } from 'app/components/ui/separator';

type ReportFiltersProps = {
  reportFilters: ReportListingFilter[];
  onChange: (reportFilters: ReportListingFilter[]) => void;
};

type ReportFilterCheckboxProps = {
  children: ReactNode;
  isChecked: boolean;
  label: string;
  onCheckedChange: (filter: ReportListingFilter, isChecked: boolean) => void;
  value: ReportListingFilter;
};

const ReportFilterCheckbox = ({
  children,
  isChecked,
  label,
  onCheckedChange,
  value,
}: ReportFilterCheckboxProps) => {
  const id = `report-filter-${value}`;

  return (
    <div className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent">
      <Checkbox
        id={id}
        checked={isChecked}
        onCheckedChange={(checked) => onCheckedChange(value, checked === true)}
      />
      <Label
        className="min-w-0 flex-1 cursor-pointer justify-between gap-3"
        htmlFor={id}
      >
        <span className="truncate">{label}</span>
        <span className="text-muted-foreground grayscale">{children}</span>
      </Label>
    </div>
  );
};

export const ReportFilters = ({
  reportFilters,
  onChange,
}: ReportFiltersProps) => {
  const { t } = useTranslation();
  const [selectedFilters, setSelectedFilters] = useState(reportFilters);
  const activeFilters = new Set(selectedFilters);

  useEffect(() => {
    setSelectedFilters(reportFilters);
  }, [reportFilters]);

  const updateFilter = (filter: ReportListingFilter, isChecked: boolean) => {
    const nextFilters = isChecked
      ? Array.from(new Set([...selectedFilters, filter]))
      : selectedFilters.filter((value) => value !== filter);

    setSelectedFilters(nextFilters);
    onChange(nextFilters);
  };

  return (
    <SectionContent>
      <div className="flex items-center gap-2">
        <Text className="font-semibold">{t('Filter reports')}</Text>
      </div>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              aria-label={t('Report filters')}
              size="sm"
              variant="outline"
            >
              <LuListFilter className="size-4" />
              {t('Report filters')}
              <Badge variant="secondary">{selectedFilters.length}</Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-80 p-3"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Text
                  as="h3"
                  className="text-sm font-semibold"
                >
                  {t('Report types')}
                </Text>
                <div className="grid gap-1">
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('scouting')}
                    label={t('Scouting')}
                    onCheckedChange={updateFilter}
                    value="scouting"
                  >
                    <Icon
                      className="size-4 !text-current"
                      shouldShowTooltip={false}
                      type="scoutAttackerNoLoss"
                    />
                  </ReportFilterCheckbox>
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('movement')}
                    label={t('Movement')}
                    onCheckedChange={updateFilter}
                    value="movement"
                  >
                    <PiSignpostBold className="size-4" />
                  </ReportFilterCheckbox>
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('battle')}
                    label={t('Battle')}
                    onCheckedChange={updateFilter}
                    value="battle"
                  >
                    <LuSword className="size-4" />
                  </ReportFilterCheckbox>
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('adventure')}
                    label={t('Adventure')}
                    onCheckedChange={updateFilter}
                    value="adventure"
                  >
                    <PiPathBold className="size-4" />
                  </ReportFilterCheckbox>
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('trade')}
                    label={t('Trade')}
                    onCheckedChange={updateFilter}
                    value="trade"
                  >
                    <LuScale className="size-4" />
                  </ReportFilterCheckbox>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Separator orientation="horizontal" />
                <Text
                  as="h3"
                  className="text-sm font-semibold"
                >
                  {t('Village activity')}
                </Text>
                <div className="grid gap-1">
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('huntingParty')}
                    label={t('Hunting party')}
                    onCheckedChange={updateFilter}
                    value="huntingParty"
                  >
                    <Icon
                      className="size-4 !text-current"
                      shouldShowTooltip={false}
                      type="huntingParty"
                    />
                  </ReportFilterCheckbox>
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('gatheringExpedition')}
                    label={t('Gathering expedition')}
                    onCheckedChange={updateFilter}
                    value="gatheringExpedition"
                  >
                    <Icon
                      className="size-4 !text-current"
                      shouldShowTooltip={false}
                      type="gatheringExpedition"
                    />
                  </ReportFilterCheckbox>
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('unitResearch')}
                    label={t('Unit research')}
                    onCheckedChange={updateFilter}
                    value="unitResearch"
                  >
                    <Icon
                      className="size-4 !text-current"
                      shouldShowTooltip={false}
                      type="unitResearched"
                    />
                  </ReportFilterCheckbox>
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('unitImprovement')}
                    label={t('Unit improvement')}
                    onCheckedChange={updateFilter}
                    value="unitImprovement"
                  >
                    <Icon
                      className="size-4 !text-current"
                      shouldShowTooltip={false}
                      type="unitImproved"
                    />
                  </ReportFilterCheckbox>
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('villageFounded')}
                    label={t('Village founding')}
                    onCheckedChange={updateFilter}
                    value="villageFounded"
                  >
                    <Icon
                      className="size-4 !text-current"
                      shouldShowTooltip={false}
                      type="villageFounded"
                    />
                  </ReportFilterCheckbox>
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has(
                      'scheduledConstructionCancellation',
                    )}
                    label={t('Construction cancellation')}
                    onCheckedChange={updateFilter}
                    value="scheduledConstructionCancellation"
                  >
                    <Icon
                      className="size-4 !text-current"
                      shouldShowTooltip={false}
                      type="scheduledConstructionCancelled"
                    />
                  </ReportFilterCheckbox>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Separator orientation="horizontal" />
                <Text
                  as="h3"
                  className="text-sm font-semibold"
                >
                  {t('Refinements')}
                </Text>
                <div className="grid gap-1">
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('noLoss')}
                    label={t('No troop losses')}
                    onCheckedChange={updateFilter}
                    value="noLoss"
                  >
                    <LuShieldCheck className="size-4" />
                  </ReportFilterCheckbox>
                  <ReportFilterCheckbox
                    isChecked={activeFilters.has('ownTrades')}
                    label={t('Own village trades')}
                    onCheckedChange={updateFilter}
                    value="ownTrades"
                  >
                    <LuArrowLeftRight className="size-4" />
                  </ReportFilterCheckbox>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </SectionContent>
  );
};
