import { useMutation } from '@tanstack/react-query';
import { use, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { eventsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Form, FormControl, FormField, FormItem } from 'app/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { invalidateQueries } from 'app/utils/react-query';
import { formatTime } from 'app/utils/time';
import { ResourceSelector } from './components/resource-selector';
import { TargetVillageSelector } from './components/target-village-selector';
import { useMarketplaceMerchants } from './hooks/use-marketplace-merchants';
import {
  emptyResources,
  getMerchantAmount,
  getTotalResources,
} from './utils/resources';

const DEFAULT_START_HOUR = new Date().getHours();
const DEFAULT_INTERVAL_HOURS = 24;
const START_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour);
const INTERVAL_HOUR_OPTIONS = Array.from(
  { length: 24 },
  (_, index) => index + 1,
);

type MarketplaceTradeRouteFormValues = {
  resources: typeof emptyResources;
  targetVillageId?: number;
  startHour: number;
  intervalHours: number;
};

const getResourceList = (resources: typeof emptyResources) => {
  return [resources.wood, resources.clay, resources.iron, resources.wheat];
};

const ActiveTradeRoutes = ({
  routes,
}: {
  routes: GameEvent<'tradeRoute'>[];
}) => {
  const { t } = useTranslation();
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillageListing();

  const villageNameById = useMemo(() => {
    return new Map(playerVillages.map((village) => [village.id, village.name]));
  }, [playerVillages]);

  const { mutate: deleteTradeRoute, isPending } = useMutation({
    mutationFn: async (eventId: number) => {
      await apiClient.delete('/villages/:villageId/trade-routes/:eventId', {
        path: {
          villageId: currentVillage.id,
          eventId,
        },
      });
    },
    onSuccess: async (_, __, ___, context) => {
      toast.success(t('Trade route cancelled'));

      await invalidateQueries(context, [
        [eventsCacheKey, 'tradeRoute', currentVillage.id],
      ]);
    },
    onError: () => {
      toast.error(t('Trade route could not be cancelled'));
    },
  });

  return (
    <div className="overflow-x-scroll scrollbar-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Target village')}</TableHeaderCell>
            <TableHeaderCell>{t('Resources')}</TableHeaderCell>
            <TableHeaderCell>{t('Merchants')}</TableHeaderCell>
            <TableHeaderCell>{t('Interval')}</TableHeaderCell>
            <TableHeaderCell>{t('Next transfer')}</TableHeaderCell>
            <TableHeaderCell>{t('Actions')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.map((route) => (
            <TableRow key={route.id}>
              <TableCell>
                {villageNameById.get(route.targetVillageId) ??
                  t('Unknown village')}
              </TableCell>
              <TableCell>
                <span className="grid grid-cols-4 lg:grid-cols-2 justify-items-center gap-2">
                  <Resources resources={getResourceList(route.resources)} />
                </span>
              </TableCell>
              <TableCell>{formatNumber(route.merchantAmount)}</TableCell>
              <TableCell>{formatTime(route.interval)}</TableCell>
              <TableCell>
                <Countdown endsAt={route.resolvesAt} />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => deleteTradeRoute(route.id)}
                >
                  {t('Cancel')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {routes.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                {t('No trade routes are currently scheduled')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export const MarketplaceTradeRoutes = () => {
  const { t } = useTranslation();
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillageListing();
  const { merchant, marketplaceLevel } = useMarketplaceMerchants();
  const { eventsByType: tradeRoutes } = useEventsByType('tradeRoute');

  const form = useForm<MarketplaceTradeRouteFormValues>({
    defaultValues: {
      resources: emptyResources,
      startHour: DEFAULT_START_HOUR,
      intervalHours: DEFAULT_INTERVAL_HOURS,
    },
  });

  const selectedResources = form.watch('resources');
  const targetVillageId = form.watch('targetVillageId');
  const startHour = form.watch('startHour');
  const intervalHours = form.watch('intervalHours');

  const targetVillages = useMemo(() => {
    return playerVillages.filter((village) => village.id !== currentVillage.id);
  }, [currentVillage.id, playerVillages]);

  const totalCapacity = marketplaceLevel * merchant.merchantCapacity;
  const capacityResources = useMemo(
    () => ({
      wood: totalCapacity,
      clay: totalCapacity,
      iron: totalCapacity,
      wheat: totalCapacity,
    }),
    [totalCapacity],
  );
  const totalSelectedResources = getTotalResources(selectedResources);
  const merchantAmount = getMerchantAmount(
    selectedResources,
    merchant.merchantCapacity,
  );
  const hasTargetVillage = targetVillages.some(
    (village) => village.id === targetVillageId,
  );
  const isStartHourValid = startHour >= 0 && startHour <= 23;
  const isIntervalValid = intervalHours > 0;
  const canSubmit =
    hasTargetVillage &&
    totalSelectedResources > 0 &&
    totalSelectedResources <= totalCapacity &&
    merchantAmount > 0 &&
    isStartHourValid &&
    isIntervalValid;

  const { mutate: createTradeRoute, isPending } = useMutation({
    mutationFn: async () => {
      await apiClient.post('/villages/:villageId/trade-routes', {
        path: {
          villageId: currentVillage.id,
        },
        body: {
          targetVillageId: targetVillageId!,
          resources: selectedResources,
          startHour,
          intervalHours,
        },
      });
    },
    onSuccess: async (_, __, ___, context) => {
      form.reset({
        resources: emptyResources,
        startHour,
        intervalHours,
      });
      toast.success(t('Trade route scheduled'));

      await invalidateQueries(context, [
        [eventsCacheKey, 'tradeRoute', currentVillage.id],
      ]);
    },
    onError: () => {
      toast.error(t('Trade route could not be scheduled'));
    },
  });

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="trade-routes" />
        <Text as="h2">{t('Trade routes')}</Text>
        <Text>
          {t(
            'Schedule recurring marketplace transfers from this village to one of your other villages. Each transfer only starts if enough resources and free merchants are available at that time.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(() => {
              if (canSubmit) {
                createTradeRoute();
              }
            })}
          >
            <Text className="font-medium">
              {t('Merchant capacity')}: {formatNumber(totalCapacity)} (
              {formatNumber(marketplaceLevel)} x{' '}
              {formatNumber(merchant.merchantCapacity)})
            </Text>

            <ResourceSelector
              availableLabel={t('Capacity')}
              availableResources={capacityResources}
              merchantCapacity={merchant.merchantCapacity}
              selectedResources={selectedResources}
              totalCapacity={totalCapacity}
            />

            <div className="flex gap-2 flex-wrap">
              <TargetVillageSelector targetVillages={targetVillages} />

              <FormField
                control={form.control}
                name="startHour"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <label
                      htmlFor="trade-route-start-hour"
                      className="text-sm font-medium"
                    >
                      {t('Begin at')}
                    </label>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => {
                        field.onChange(Number.parseInt(value, 10));
                      }}
                    >
                      <FormControl>
                        <SelectTrigger
                          id="trade-route-start-hour"
                          className="bg-emerald-50/50 dark:bg-emerald-950/20"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {START_HOUR_OPTIONS.map((hour) => (
                          <SelectItem
                            key={hour}
                            value={hour.toString()}
                          >
                            {hour.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="intervalHours"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <label
                      htmlFor="trade-route-interval"
                      className="text-sm font-medium"
                    >
                      {t('Repeat every')}
                    </label>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => {
                        field.onChange(Number.parseInt(value, 10));
                      }}
                    >
                      <FormControl>
                        <SelectTrigger
                          id="trade-route-interval"
                          className="bg-emerald-50/50 dark:bg-emerald-950/20"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INTERVAL_HOUR_OPTIONS.map((hours) => (
                          <SelectItem
                            key={hours}
                            value={hours.toString()}
                          >
                            {hours === 1
                              ? t('1 hour')
                              : t('{{count}} hours', { count: hours })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!canSubmit || isPending}
              >
                {t('Create trade route')}
              </Button>
            </div>
          </form>
        </Form>
      </SectionContent>
      <SectionContent>
        <Text
          as="h3"
          className="font-medium"
        >
          {t('Scheduled trade routes')}
        </Text>
        <ActiveTradeRoutes routes={tradeRoutes} />
      </SectionContent>
    </Section>
  );
};
