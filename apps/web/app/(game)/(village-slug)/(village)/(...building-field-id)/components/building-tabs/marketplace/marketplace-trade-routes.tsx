import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use, useMemo, useState } from 'react';
import {
  type DefaultValues,
  type UseFormReturn,
  useForm,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';
import type { TradeRoute } from '@pillage-first/types/models/trade-route';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { tradeRoutesCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Form } from 'app/components/ui/form';
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
import { TradeRouteIntervalSelector } from './components/trade-route-interval-selector';
import { TradeRouteStartTimeSelector } from './components/trade-route-start-time-selector';
import { useMarketplaceMerchants } from './hooks/use-marketplace-merchants';
import { emptyResources, getMerchantAmount } from './utils/resources';
import {
  createTradeRouteFormSchema,
  type MarketplaceTradeRouteFormValues,
} from './utils/trade-route-form';

const DEFAULT_INTERVAL_HOURS = 24;
const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

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
  route: TradeRoute,
): MarketplaceTradeRouteFormValues => ({
  resources: route.resources,
  targetVillageId: route.targetVillageId,
  startHour: new Date(route.startsAt).getHours(),
  startMinute: new Date(route.startsAt).getMinutes(),
  intervalHours: Math.floor(route.interval / HOUR_IN_MILLISECONDS),
  intervalMinutes: Math.floor((route.interval % HOUR_IN_MILLISECONDS) / 60_000),
});

const getDefaultTradeRouteFormValues =
  (): DefaultValues<MarketplaceTradeRouteFormValues> => ({
    resources: emptyResources,
    startHour: new Date().getHours(),
    startMinute: 0,
    intervalHours: DEFAULT_INTERVAL_HOURS,
    intervalMinutes: 0,
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

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
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

          <TradeRouteStartTimeSelector />
          <TradeRouteIntervalSelector />
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
            disabled={!form.formState.isValid || isSubmitting}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const SavedTradeRoutes = ({
  merchant,
  onEdit,
  routes,
}: {
  merchant: ReturnType<typeof useMarketplaceMerchants>['merchant'];
  onEdit: (route: TradeRoute) => void;
  routes: TradeRoute[];
}) => {
  const { t } = useTranslation();
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillageListing();

  const villageById = useMemo(() => {
    return new Map(playerVillages.map((village) => [village.id, village]));
  }, [playerVillages]);

  const routesByTargetVillage = useMemo(() => {
    const groups = new Map<number, TradeRoute[]>();

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
    mutationFn: async (routeId: number) => {
      await apiClient.delete('/trade-routes/:routeId', {
        path: {
          routeId,
        },
      });
    },
    onSuccess: async (_, __, ___, context) => {
      toast.success(t('Trade route deleted'));

      await invalidateQueries(context, [
        [tradeRoutesCacheKey, currentVillage.id],
      ]);
    },
    onError: () => {
      toast.error(t('Trade route could not be deleted'));
    },
  });

  const { mutate: togglePaused, isPending: isPausePending } = useMutation({
    mutationFn: async (route: TradeRoute) => {
      await apiClient.patch('/trade-routes/:routeId/paused', {
        path: { routeId: route.id },
        body: { paused: !route.paused },
      });
    },
    onSuccess: async (_, route, ___, context) => {
      toast.success(
        route.paused ? t('Trade route resumed') : t('Trade route paused'),
      );

      await invalidateQueries(context, [
        [tradeRoutesCacheKey, currentVillage.id],
      ]);
    },
    onError: () => {
      toast.error(t('Trade route could not be updated'));
    },
  });

  if (routes.length === 0) {
    return (
      <OverflowContainer>
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
              <TableCell colSpan={5}>{t('No saved trade routes')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </OverflowContainer>
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

            <OverflowContainer>
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
                        {formatNumber(
                          getMerchantAmount(
                            route.resources,
                            merchant.merchantCapacity,
                          ),
                        )}
                      </TableCell>
                      <TableCell>{formatTime(route.interval)}</TableCell>
                      <TableCell>
                        {route.paused ? (
                          t('Paused')
                        ) : route.nextAt !== null ? (
                          <Countdown endsAt={route.nextAt} />
                        ) : (
                          t('Unscheduled')
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending || isPausePending}
                            onClick={() => togglePaused(route)}
                          >
                            {route.paused ? t('Resume') : t('Pause')}
                          </Button>
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
                            disabled={isPending || isPausePending}
                            onClick={() => deleteTradeRoute(route.id)}
                          >
                            {t('Delete')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </OverflowContainer>
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
  const { data: tradeRoutes } = useSuspenseQuery({
    queryKey: [tradeRoutesCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/tiles/:tileId/trade-routes', {
        path: { tileId: currentVillage.tileId },
      });

      return data;
    },
  });

  const [editingTradeRoute, setEditingTradeRoute] = useState<TradeRoute | null>(
    null,
  );

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

  const formSchema = useMemo(
    () =>
      createTradeRouteFormSchema(
        targetVillages.map((village) => village.id),
        totalCapacity,
      ),
    [targetVillages, totalCapacity],
  );
  const createForm = useForm<MarketplaceTradeRouteFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: getDefaultTradeRouteFormValues(),
  });
  const editForm = useForm<MarketplaceTradeRouteFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: getDefaultTradeRouteFormValues(),
  });

  const { mutate: createTradeRoute, isPending } = useMutation({
    mutationFn: async (values: MarketplaceTradeRouteFormValues) => {
      const targetVillage = targetVillages.find(
        (village) => village.id === values.targetVillageId,
      )!;

      await apiClient.post('/tiles/:tileId/trade-routes', {
        path: {
          tileId: currentVillage.tileId,
        },
        body: {
          targetTileId: targetVillage.tileId,
          resources: values.resources,
          startHour: values.startHour,
          startMinute: values.startMinute,
          intervalHours: values.intervalHours,
          intervalMinutes: values.intervalMinutes,
        },
      });
    },
    onSuccess: async (_, __, ___, context) => {
      createForm.reset(getDefaultTradeRouteFormValues());
      toast.success(t('Trade route scheduled'));

      await invalidateQueries(context, [
        [tradeRoutesCacheKey, currentVillage.id],
      ]);
    },
    onError: () => {
      toast.error(t('Trade route could not be scheduled'));
    },
  });

  const { mutate: updateTradeRoute, isPending: isUpdatePending } = useMutation({
    mutationFn: async (values: MarketplaceTradeRouteFormValues) => {
      const targetVillage = targetVillages.find(
        (village) => village.id === values.targetVillageId,
      )!;

      await apiClient.patch('/trade-routes/:routeId', {
        path: {
          routeId: editingTradeRoute!.id,
        },
        body: {
          targetTileId: targetVillage.tileId,
          resources: values.resources,
          startHour: values.startHour,
          startMinute: values.startMinute,
          intervalHours: values.intervalHours,
          intervalMinutes: values.intervalMinutes,
        },
      });
    },
    onSuccess: async (_, __, ___, context) => {
      setEditingTradeRoute(null);
      editForm.reset(getDefaultTradeRouteFormValues());
      toast.success(t('Trade route updated'));

      await invalidateQueries(context, [
        [tradeRoutesCacheKey, currentVillage.id],
      ]);
    },
    onError: () => {
      toast.error(t('Trade route could not be updated'));
    },
  });

  const startEditingTradeRoute = (route: TradeRoute) => {
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
        <InformationPopover ariaLabel={t('Trade routes')}>
          <Text>
            {t(
              'Schedule recurring marketplace transfers from this village to one of your other villages. Each transfer only starts if enough resources and free merchants are available at that time. Pause a route to stop future departures while keeping its settings. Transfers already in progress will continue.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Trade routes')}</Text>
      </SectionContent>
      <SectionContent>
        <SavedTradeRoutes
          merchant={merchant}
          routes={tradeRoutes}
          onEdit={startEditingTradeRoute}
        />
      </SectionContent>
      <SectionContent>
        <Text as="h3">{t('Create new trade route')}</Text>
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
