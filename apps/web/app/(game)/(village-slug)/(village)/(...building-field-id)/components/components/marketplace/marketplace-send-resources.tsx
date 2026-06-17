import { useMutation, useQueryClient } from '@tanstack/react-query';
import { use, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type {
  Resource,
  Resources as ResourcesType,
} from '@pillage-first/types/models/resource';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import {
  currentVillageCacheKey,
  eventsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { Separator } from 'app/components/ui/separator';
import { formatTime } from 'app/utils/time';
import { useMarketplaceMerchants } from './hooks/use-marketplace-merchants';
import {
  clampResourceAmount,
  emptyResources,
  getMerchantAmount,
  getMerchantMovementDuration,
  getResourceInputMax,
  getTotalResources,
  resourceTypes,
} from './utils/resources';
import type { VillageOption } from './utils/villages';

type MarketplaceSendResourcesFormValues = {
  resources: ResourcesType;
  targetVillageId?: number;
};

const VillageLabel = ({ village }: { village: VillageOption }) => {
  return (
    <>
      {village.name} ({village.coordinates.x}|{village.coordinates.y})
    </>
  );
};

type ResourceTransferConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetVillage: VillageOption | undefined;
  resources: ResourcesType;
  duration: number;
  merchantAmount: number;
  isPending: boolean;
};

const ResourceTransferConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  targetVillage,
  resources,
  duration,
  merchantAmount,
  isPending,
}: ResourceTransferConfirmationModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('Confirm resource transfer')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Resources
              resources={[
                resources.wood,
                resources.clay,
                resources.iron,
                resources.wheat,
              ]}
            />
          </div>

          <Separator orientation="horizontal" />

          <div className="space-y-2">
            <div className="flex justify-between gap-4">
              <Text className="text-muted-foreground">{t('Destination')}:</Text>
              <Text className="text-right font-medium">
                {targetVillage ? <VillageLabel village={targetVillage} /> : '-'}
              </Text>
            </div>
            <div className="flex justify-between gap-4">
              <Text className="text-muted-foreground">{t('Duration')}:</Text>
              <Text className="font-medium">{formatTime(duration)}</Text>
            </div>
            <div className="flex justify-between gap-4">
              <Text className="text-muted-foreground">
                {t('Merchants occupied')}:
              </Text>
              <Text className="font-medium">
                {formatNumber(merchantAmount)}
              </Text>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            {t('Back')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
          >
            {t('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const MarketplaceSendResources = () => {
  const { t } = useTranslation();
  const { apiClient } = use(ApiContext);
  const queryClient = useQueryClient();
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillageListing();
  const { mapSize, serverSpeed } = useServer();
  const { merchant, marketplaceLevel, availableMerchantAmount } =
    useMarketplaceMerchants();

  const form = useForm<MarketplaceSendResourcesFormValues>({
    defaultValues: {
      resources: emptyResources,
      targetVillageId: undefined,
    },
  });
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const selectedResources = form.watch('resources');
  const targetVillageId = form.watch('targetVillageId');

  const targetVillages = useMemo(() => {
    return playerVillages.filter((village) => village.id !== currentVillage.id);
  }, [currentVillage.id, playerVillages]);

  const targetVillage = useMemo(() => {
    return targetVillages.find((village) => village.id === targetVillageId);
  }, [targetVillageId, targetVillages]);

  const totalCapacity = availableMerchantAmount * merchant.merchantCapacity;
  const totalSelectedResources = getTotalResources(selectedResources);
  const merchantAmount = getMerchantAmount(
    selectedResources,
    merchant.merchantCapacity,
  );

  const duration = useMemo(() => {
    if (!targetVillage) {
      return 0;
    }

    return getMerchantMovementDuration({
      originTileId: currentVillage.tileId,
      targetTileId: targetVillage.tileId,
      mapSize,
      merchantSpeed: merchant.merchantSpeed,
      serverSpeed,
    });
  }, [
    currentVillage.tileId,
    mapSize,
    merchant.merchantSpeed,
    serverSpeed,
    targetVillage,
  ]);

  const hasEnoughResources = resourceTypes.every(
    (resource) =>
      selectedResources[resource] <= currentVillage.resources[resource],
  );
  const hasEnoughCapacity = totalSelectedResources <= totalCapacity;
  const canSubmit =
    !!targetVillage &&
    totalSelectedResources > 0 &&
    merchantAmount > 0 &&
    merchantAmount <= availableMerchantAmount &&
    hasEnoughResources &&
    hasEnoughCapacity;

  const { mutate: transferResources, isPending } = useMutation({
    mutationFn: async () => {
      await apiClient.post('/villages/:villageId/transfer-resources', {
        path: {
          villageId: currentVillage.id,
        },
        body: {
          targetVillageId: targetVillageId!,
          resources: selectedResources,
        },
      });
    },
    onSuccess: async () => {
      form.reset({
        resources: emptyResources,
        targetVillageId: undefined,
      });
      setIsConfirmationOpen(false);
      toast.success(t('Resource transfer started'));

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [currentVillageCacheKey],
        }),
        queryClient.invalidateQueries({
          queryKey: [eventsCacheKey, 'resourceTransfer', currentVillage.id],
        }),
      ]);
    },
    onError: () => {
      toast.error(t('Resource transfer could not be started'));
    },
  });

  const setResourceAmount = (resource: Resource, value: number) => {
    form.setValue(`resources.${resource}`, value);
  };

  const incrementResourceAmount = (resource: Resource, maxAmount: number) => {
    setResourceAmount(
      resource,
      Math.min(
        selectedResources[resource] + merchant.merchantCapacity,
        maxAmount,
      ),
    );
  };

  const decrementResourceAmount = (resource: Resource) => {
    setResourceAmount(
      resource,
      Math.max(0, selectedResources[resource] - merchant.merchantCapacity),
    );
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    setIsConfirmationOpen(true);
  };

  return (
    <>
      <Section>
        <SectionContent>
          <Bookmark tab="trade" />
          <Text as="h2">{t('Send resources')}</Text>
          <Text>{t('Send resources between your villages.')}</Text>
        </SectionContent>
        <SectionContent>
          <div className="flex flex-col gap-2">
            <Text className="font-medium">
              {t('Free merchants')}: {formatNumber(availableMerchantAmount)} /{' '}
              {formatNumber(marketplaceLevel)}
            </Text>
          </div>
        </SectionContent>
        <SectionContent>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {resourceTypes.map((resource) => {
                  const maxAmount = getResourceInputMax({
                    availableResources: currentVillage.resources,
                    selectedResources,
                    resource,
                    totalCapacity,
                  });
                  const selectedAmount = selectedResources[resource];

                  return (
                    <FormField
                      key={resource}
                      control={form.control}
                      name={`resources.${resource}`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <div className="flex justify-between gap-2">
                            <label
                              htmlFor={`resource-${resource}`}
                              className="flex items-center gap-1"
                            >
                              <Icon
                                type={resource}
                                className="size-5"
                              />
                            </label>
                            <button
                              type="button"
                              className="text-sm font-medium text-green-600 hover:underline disabled:text-gray-400 disabled:no-underline dark:text-green-400 dark:disabled:text-gray-500"
                              disabled={maxAmount === 0}
                              onClick={() =>
                                setResourceAmount(resource, maxAmount)
                              }
                            >
                              ({formatNumber(maxAmount)})
                            </button>
                          </div>
                          <FormControl>
                            <Input
                              id={`resource-${resource}`}
                              type="number"
                              min={0}
                              max={maxAmount}
                              value={field.value}
                              className="bg-emerald-50/50 dark:bg-emerald-950/20"
                              onChange={(event) => {
                                field.onChange(
                                  clampResourceAmount(
                                    event.target.value,
                                    maxAmount,
                                  ),
                                );
                              }}
                            />
                          </FormControl>
                          <div className="flex justify-between">
                            <Button
                              type="button"
                              variant="outline"
                              size="fit"
                              className="text-xs"
                              disabled={selectedAmount <= 0}
                              onClick={() => decrementResourceAmount(resource)}
                            >
                              - {merchant.merchantCapacity}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="fit"
                              className="text-xs"
                              disabled={
                                maxAmount === 0 || selectedAmount >= maxAmount
                              }
                              onClick={() =>
                                incrementResourceAmount(resource, maxAmount)
                              }
                            >
                              + {merchant.merchantCapacity}
                            </Button>
                          </div>
                          <Text className="text-xs text-muted-foreground">
                            {t('Available')}:{' '}
                            {formatNumber(currentVillage.resources[resource])}
                          </Text>
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>

              <FormField
                control={form.control}
                name="targetVillageId"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <label
                      htmlFor="marketplace-target-village"
                      className="text-sm font-medium"
                    >
                      {t('Target village')}
                    </label>
                    <Select
                      value={field.value?.toString() ?? ''}
                      onValueChange={(value) => {
                        field.onChange(Number.parseInt(value, 10));
                      }}
                    >
                      <FormControl>
                        <SelectTrigger
                          id="marketplace-target-village"
                          className="bg-emerald-50/50 dark:bg-emerald-950/20"
                        >
                          <SelectValue placeholder={t('Select village')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {targetVillages.map((village) => (
                          <SelectItem
                            key={village.id}
                            value={village.id.toString()}
                          >
                            <VillageLabel village={village} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!canSubmit}
                >
                  {t('Send resources')}
                </Button>
              </div>
            </form>
          </Form>
        </SectionContent>
      </Section>

      <ResourceTransferConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={() => transferResources()}
        targetVillage={targetVillage}
        resources={selectedResources}
        duration={duration}
        merchantAmount={merchantAmount}
        isPending={isPending}
      />
    </>
  );
};
