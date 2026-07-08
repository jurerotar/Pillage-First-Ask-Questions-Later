import { useMutation } from '@tanstack/react-query';
import { use, useMemo, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
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
import { InformationPopover } from 'app/(game)/components/information-popover';
import { eventsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
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
const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
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

type MarketplaceTradeRouteFormProps = {
  capacityResources: typeof emptyResources;
  form: UseFormReturn<MarketplaceTradeRouteFormValues>;
  isSubmitting: boolean;
  marketplaceLevel: number;
  merchant: ReturnType<typeof useMarketplaceMerchants>['merchant'];
  onCancel?: () => void;
  onSubmit: (values: MarketplaceTradeRouteFormValues) => void;
  submitLabel: string;
  targetVillages: ReturnType<typeof usePlayerVillageListing>['playerVillages'];
  totalCapacity: number;
};

const getResourceList = (resources: typeof emptyResources) => {
  return [resources.wood, resources.clay, resources.iron, resources.wheat];
};

const getTradeRouteFormValues = (
  route: GameEvent<'tradeRoute'>,
): MarketplaceTradeRouteFormValues => ({
  resources: route.resources,
  targetVillageId: route.targetVillageId,
  startHour: new Date(route.startsAt).getHours(),
  intervalHours: Math.round(route.interval / HOUR_IN_MILLISECONDS),
});

const getDefaultTradeRouteFormValues = (): MarketplaceTradeRouteFormValues => ({
  resources: emptyResources,
  startHour: DEFAULT_START_HOUR,
  intervalHours: DEFAULT_INTERVAL_HOURS,
});

const MarketplaceTradeRouteForm = ({
  capacityResources,
  form,
  isSubmitting,
  merchant,
  onCancel,
  onSubmit,
  submitLabel,
  targetVillages,
  totalCapacity,
}: MarketplaceTradeRouteFormProps) => {
  const { t } = useTranslation();
  const selectedResources = form.watch('resources');
  const targetVillageId = form.watch('targetVillageId');
  const startHour = form.watch('startHour');
  const intervalHours = form.watch('intervalHours');

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

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          if (canSubmit) {
            onSubmit(values);
          }
        })}
      >
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
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              {t('Cancel')}
            </Button>
          ) : null}
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const ActiveTradeRoutes = ({
  onEdit,
  routes,
}: {
  onEdit: (route: GameEvent<'tradeRoute'>) => void;
  routes: GameEvent<'tradeRoute'>[];
}) => {
  const { t } = useTranslation();
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillageListing();

  const villageById = useMemo(() => {
    return new Map(playerVillages.map((village) => [village.id, village]));
  }, [playerVillages]);
  const routesByTargetVillage = useMemo(() => {
    const groups = new Map<number, GameEvent<'tradeRoute'>[]>();

    for (const route of routes) {
      const group = groups.get(route.targetVillageId) ?? [];
      group.push(route);
      groups.set(route.targetVillageId, group);
    }

    return Array.from(groups, ([targetVillageId, villageRoutes]) => ({
      targetVillageId,
      village: villageById.get(targetVillageId)!,
      villageRoutes,
    }));
  }, [routes, villageById]);

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

  if (routes.length === 0) {
    return (
      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Resources')}</TableHeaderCell>
              <TableHeaderCell>{t('Merchants')}</TableHeaderCell>
              <TableHeaderCell>{t('Interval')}</TableHeaderCell>
              <TableHeaderCell>{t('Next transfer')}</TableHeaderCell>
              <TableHeaderCell>{t('Actions')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5}>
                {t('No trade routes are currently scheduled')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {routesByTargetVillage.map(
        ({ targetVillageId, village, villageRoutes }) => (
          <div
            key={targetVillageId}
            className="space-y-3"
          >
            <Text
              variant="link"
              className="font-medium"
            >
              <Link
                to={`../map?x=${village.coordinates.x}&y=${village.coordinates.y}`}
              >
                {village.name} ({village.coordinates.x} |{' '}
                {village.coordinates.y})
              </Link>
            </Text>

            <div className="overflow-x-scroll scrollbar-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>{t('Resources')}</TableHeaderCell>
                    <TableHeaderCell>{t('Merchants')}</TableHeaderCell>
                    <TableHeaderCell>{t('Interval')}</TableHeaderCell>
                    <TableHeaderCell>{t('Next transfer')}</TableHeaderCell>
                    <TableHeaderCell>{t('Actions')}</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {villageRoutes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell>
                        <span className="grid grid-cols-4 lg:grid-cols-2 justify-items-center gap-2">
                          <Resources
                            resources={getResourceList(route.resources)}
                          />
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatNumber(route.merchantAmount)}
                      </TableCell>
                      <TableCell>{formatTime(route.interval)}</TableCell>
                      <TableCell>
                        <Countdown endsAt={route.resolvesAt} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(route)}
                          >
                            {t('Edit')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => deleteTradeRoute(route.id)}
                          >
                            {t('Cancel')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ),
      )}
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
  const [editingTradeRoute, setEditingTradeRoute] =
    useState<GameEvent<'tradeRoute'> | null>(null);

  const createForm = useForm<MarketplaceTradeRouteFormValues>({
    defaultValues: getDefaultTradeRouteFormValues(),
  });
  const editForm = useForm<MarketplaceTradeRouteFormValues>({
    defaultValues: getDefaultTradeRouteFormValues(),
  });

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

  const { mutate: createTradeRoute, isPending } = useMutation({
    mutationFn: async (values: MarketplaceTradeRouteFormValues) => {
      await apiClient.post('/villages/:villageId/trade-routes', {
        path: {
          villageId: currentVillage.id,
        },
        body: {
          targetVillageId: values.targetVillageId!,
          resources: values.resources,
          startHour: values.startHour,
          intervalHours: values.intervalHours,
        },
      });
    },
    onSuccess: async (_, __, ___, context) => {
      createForm.reset(getDefaultTradeRouteFormValues());
      toast.success(t('Trade route scheduled'));

      await invalidateQueries(context, [
        [eventsCacheKey, 'tradeRoute', currentVillage.id],
      ]);
    },
    onError: () => {
      toast.error(t('Trade route could not be scheduled'));
    },
  });

  const { mutate: updateTradeRoute, isPending: isUpdatePending } = useMutation({
    mutationFn: async (values: MarketplaceTradeRouteFormValues) => {
      await apiClient.patch('/villages/:villageId/trade-routes/:eventId', {
        path: {
          villageId: currentVillage.id,
          eventId: editingTradeRoute!.id,
        },
        body: {
          targetVillageId: values.targetVillageId!,
          resources: values.resources,
          startHour: values.startHour,
          intervalHours: values.intervalHours,
        },
      });
    },
    onSuccess: async (_, __, ___, context) => {
      setEditingTradeRoute(null);
      editForm.reset(getDefaultTradeRouteFormValues());
      toast.success(t('Trade route updated'));

      await invalidateQueries(context, [
        [eventsCacheKey, 'tradeRoute', currentVillage.id],
      ]);
    },
    onError: () => {
      toast.error(t('Trade route could not be updated'));
    },
  });

  const startEditingTradeRoute = (route: GameEvent<'tradeRoute'>) => {
    setEditingTradeRoute(route);
    editForm.reset(getTradeRouteFormValues(route));
  };

  const cancelEditingTradeRoute = () => {
    setEditingTradeRoute(null);
    editForm.reset(getDefaultTradeRouteFormValues());
  };

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="trade-routes" />
        <InformationPopover
          ariaLabel={t('Trade routes')}
          className="right-12"
        >
          <Text>
            {t(
              'Schedule recurring marketplace transfers from this village to one of your other villages. Each transfer only starts if enough resources and free merchants are available at that time.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Trade routes')}</Text>
      </SectionContent>
      <SectionContent>
        <MarketplaceTradeRouteForm
          capacityResources={capacityResources}
          form={createForm}
          isSubmitting={isPending}
          marketplaceLevel={marketplaceLevel}
          merchant={merchant}
          onSubmit={createTradeRoute}
          submitLabel={t('Create trade route')}
          targetVillages={targetVillages}
          totalCapacity={totalCapacity}
        />
      </SectionContent>
      <SectionContent>
        <Text
          as="h3"
          className="font-medium"
        >
          {t('Scheduled trade routes')}
        </Text>
        <ActiveTradeRoutes
          routes={tradeRoutes}
          onEdit={startEditingTradeRoute}
        />
      </SectionContent>
      <Dialog
        open={editingTradeRoute !== null}
        onOpenChange={(open) => {
          if (!open) {
            cancelEditingTradeRoute();
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('Edit trade route')}</DialogTitle>
          </DialogHeader>
          <MarketplaceTradeRouteForm
            capacityResources={capacityResources}
            form={editForm}
            isSubmitting={isUpdatePending}
            marketplaceLevel={marketplaceLevel}
            merchant={merchant}
            onCancel={cancelEditingTradeRoute}
            onSubmit={updateTradeRoute}
            submitLabel={t('Save changes')}
            targetVillages={targetVillages}
            totalCapacity={totalCapacity}
          />
        </DialogContent>
      </Dialog>
    </Section>
  );
};
