import { useEffect, useState } from 'react';
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

const reportFilterGroups = [
  {
    label: 'Report types',
    filters: [
      {
        value: 'scouting',
        label: 'Scouting',
        icon: (
          <Icon
            className="size-4 !text-current"
            shouldShowTooltip={false}
            type="scoutAttackerNoLoss"
          />
        ),
      },
      {
        value: 'movement',
        label: 'Movement',
        icon: <PiSignpostBold className="size-4" />,
      },
      {
        value: 'battle',
        label: 'Battle',
        icon: <LuSword className="size-4" />,
      },
      {
        value: 'adventure',
        label: 'Adventure',
        icon: <PiPathBold className="size-4" />,
      },
      {
        value: 'trade',
        label: 'Trade',
        icon: <LuScale className="size-4" />,
      },
    ],
  },
  {
    label: 'Village activity',
    filters: [
      {
        value: 'huntingParty',
        label: 'Hunting party',
        icon: (
          <Icon
            className="size-4 !text-current"
            type="huntingParty"
          />
        ),
      },
      {
        value: 'gatheringExpedition',
        label: 'Gathering expedition',
        icon: (
          <Icon
            className="size-4 !text-current"
            type="gatheringExpedition"
          />
        ),
      },
      {
        value: 'unitResearch',
        label: 'Unit research',
        icon: (
          <Icon
            className="size-4 !text-current"
            type="unitResearchDuration"
          />
        ),
      },
      {
        value: 'unitImprovement',
        label: 'Unit improvement',
        icon: (
          <Icon
            className="size-4 !text-current"
            type="unitImprovementDuration"
          />
        ),
      },
      {
        value: 'villageFounded',
        label: 'Village founding',
        icon: (
          <Icon
            className="size-4 !text-current"
            type="findNewVillage"
          />
        ),
      },
      {
        value: 'scheduledConstructionCancellation',
        label: 'Construction cancellation',
        icon: (
          <Icon
            className="size-4 !text-current"
            type="scheduledConstructionCancelled"
          />
        ),
      },
    ],
  },
  {
    label: 'Refinements',
    filters: [
      {
        value: 'noLoss',
        label: 'No troop losses',
        icon: <LuShieldCheck className="size-4" />,
      },
      {
        value: 'ownTrades',
        label: 'Own village trades',
        icon: <LuArrowLeftRight className="size-4" />,
      },
    ],
  },
] satisfies {
  label: string;
  filters: {
    value: ReportListingFilter;
    label: string;
    icon: React.ReactNode;
  }[];
}[];

const reportFilterValues = reportFilterGroups.flatMap(({ filters }) =>
  filters.map(({ value }) => value),
);

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
    const nextFilters = reportFilterValues.filter((value) =>
      value === filter ? isChecked : activeFilters.has(value),
    );

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
              {reportFilterGroups.map((group, groupIndex) => (
                <div
                  className="flex flex-col gap-2"
                  key={group.label}
                >
                  {groupIndex > 0 && <Separator orientation="horizontal" />}
                  <Text
                    as="h3"
                    className="text-sm font-semibold"
                  >
                    {t(group.label)}
                  </Text>
                  <div className="grid gap-1">
                    {group.filters.map(({ value, label, icon }) => {
                      const id = `report-filter-${value}`;

                      return (
                        <div
                          className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent"
                          key={value}
                        >
                          <Checkbox
                            id={id}
                            checked={activeFilters.has(value)}
                            onCheckedChange={(checked) =>
                              updateFilter(value, checked === true)
                            }
                          />
                          <Label
                            className="min-w-0 flex-1 cursor-pointer justify-between gap-3"
                            htmlFor={id}
                          >
                            <span className="truncate">{t(label)}</span>
                            <span className="text-muted-foreground">
                              {icon}
                            </span>
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </SectionContent>
  );
};
