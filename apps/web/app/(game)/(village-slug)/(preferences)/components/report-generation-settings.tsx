import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LuArrowLeftRight,
  LuScale,
  LuShieldCheck,
  LuSword,
} from 'react-icons/lu';
import { PiPathBold, PiSignpostBold } from 'react-icons/pi';
import {
  type ReportListingFilter,
  reportListingFilterSchema,
} from '@pillage-first/types/dtos/report';
import { reportGenerationSettingsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Checkbox } from 'app/components/ui/checkbox';
import { Label } from 'app/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';
import { Separator } from 'app/components/ui/separator';

type ReportGenerationCheckboxProps = {
  children: ReactNode;
  disabled: boolean;
  isChecked: boolean;
  label: string;
  onCheckedChange: (filter: ReportListingFilter, isChecked: boolean) => void;
  value: ReportListingFilter;
};

const ReportGenerationCheckbox = ({
  children,
  disabled,
  isChecked,
  label,
  onCheckedChange,
  value,
}: ReportGenerationCheckboxProps) => {
  const id = `report-generation-${value}`;

  return (
    <div className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent">
      <Checkbox
        id={id}
        disabled={disabled}
        checked={isChecked}
        onCheckedChange={(checked) => onCheckedChange(value, checked)}
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

export const ReportGenerationSettings = () => {
  const { t } = useTranslation();
  const { apiClient } = use(ApiContext);

  const { data: disabledFilters } = useSuspenseQuery({
    queryKey: [reportGenerationSettingsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/report-generation');
      return data;
    },
  });

  const { mutate, isPending, isError } = useMutation({
    mutationFn: async (disabledFilters: ReportListingFilter[]) => {
      await apiClient.patch('/me/report-generation', {
        body: { disabledFilters },
      });
    },
    onSuccess: async (_data, _variables, _result, context) => {
      await context.client.invalidateQueries({
        queryKey: [reportGenerationSettingsCacheKey],
      });
    },
  });

  const selected = new Set(
    reportListingFilterSchema.options.filter(
      (filter) => !disabledFilters.includes(filter),
    ),
  );

  const updateGenerationFilter = (
    filter: ReportListingFilter,
    checked: boolean,
  ) => {
    mutate(
      checked
        ? disabledFilters.filter((value) => value !== filter)
        : [...disabledFilters, filter],
    );
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
          >
            {t('Report generation')}
          </Button>
        }
      />
      <PopoverContent
        align="start"
        className="w-80 max-w-[calc(100vw-2rem)] p-3"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Text
              as="h3"
              className="font-medium"
            >
              {t('Report generation')}
            </Text>
            <Text>
              {t(
                'Choose which reports to generate across all your villages. Existing reports are kept.',
              )}
            </Text>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Text
                as="h3"
                className="text-sm font-semibold"
              >
                {t('Report types')}
              </Text>
              <div className="grid gap-1">
                <ReportGenerationCheckbox
                  isChecked={selected.has('scouting')}
                  label={t('Scouting')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="scouting"
                >
                  <Icon
                    className="size-4 !text-current"
                    shouldShowTooltip={false}
                    type="scoutAttackerNoLoss"
                  />
                </ReportGenerationCheckbox>
                <ReportGenerationCheckbox
                  isChecked={selected.has('movement')}
                  label={t('Movement')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="movement"
                >
                  <PiSignpostBold className="size-4" />
                </ReportGenerationCheckbox>
                <ReportGenerationCheckbox
                  isChecked={selected.has('battle')}
                  label={t('Battle')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="battle"
                >
                  <LuSword className="size-4" />
                </ReportGenerationCheckbox>
                <ReportGenerationCheckbox
                  isChecked={selected.has('adventure')}
                  label={t('Adventure')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="adventure"
                >
                  <PiPathBold className="size-4" />
                </ReportGenerationCheckbox>
                <ReportGenerationCheckbox
                  isChecked={selected.has('trade')}
                  label={t('Trade')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="trade"
                >
                  <LuScale className="size-4" />
                </ReportGenerationCheckbox>
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
                <ReportGenerationCheckbox
                  isChecked={selected.has('huntingParty')}
                  label={t('Hunting party')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="huntingParty"
                >
                  <Icon
                    className="size-4 !text-current"
                    shouldShowTooltip={false}
                    type="huntingParty"
                  />
                </ReportGenerationCheckbox>
                <ReportGenerationCheckbox
                  isChecked={selected.has('gatheringExpedition')}
                  label={t('Gathering expedition')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="gatheringExpedition"
                >
                  <Icon
                    className="size-4 !text-current"
                    shouldShowTooltip={false}
                    type="gatheringExpedition"
                  />
                </ReportGenerationCheckbox>
                <ReportGenerationCheckbox
                  isChecked={selected.has('unitResearch')}
                  label={t('Unit research')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="unitResearch"
                >
                  <Icon
                    className="size-4 !text-current"
                    shouldShowTooltip={false}
                    type="unitResearched"
                  />
                </ReportGenerationCheckbox>
                <ReportGenerationCheckbox
                  isChecked={selected.has('unitImprovement')}
                  label={t('Unit improvement')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="unitImprovement"
                >
                  <Icon
                    className="size-4 !text-current"
                    shouldShowTooltip={false}
                    type="unitImproved"
                  />
                </ReportGenerationCheckbox>
                <ReportGenerationCheckbox
                  isChecked={selected.has('villageFounded')}
                  label={t('Village founding')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="villageFounded"
                >
                  <Icon
                    className="size-4 !text-current"
                    shouldShowTooltip={false}
                    type="villageFounded"
                  />
                </ReportGenerationCheckbox>
                <ReportGenerationCheckbox
                  isChecked={selected.has('scheduledConstructionCancellation')}
                  label={t('Construction cancellation')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="scheduledConstructionCancellation"
                >
                  <Icon
                    className="size-4 !text-current"
                    shouldShowTooltip={false}
                    type="scheduledConstructionCancelled"
                  />
                </ReportGenerationCheckbox>
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
                <ReportGenerationCheckbox
                  isChecked={selected.has('noLoss')}
                  label={t('No troop losses')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="noLoss"
                >
                  <LuShieldCheck className="size-4" />
                </ReportGenerationCheckbox>
                <ReportGenerationCheckbox
                  isChecked={selected.has('ownTrades')}
                  label={t('Own village trades')}
                  onCheckedChange={updateGenerationFilter}
                  disabled={isPending}
                  value="ownTrades"
                >
                  <LuArrowLeftRight className="size-4" />
                </ReportGenerationCheckbox>
              </div>
            </div>
          </div>
          {isError && (
            <Text role="alert">
              {t(
                'Could not save report generation settings. Please try again.',
              )}
            </Text>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
