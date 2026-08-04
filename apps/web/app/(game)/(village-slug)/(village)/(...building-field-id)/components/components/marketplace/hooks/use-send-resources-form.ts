import { useMutation } from '@tanstack/react-query';
import { use, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { CurrentVillageLiveResourcesContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';
import {
  currentVillageCacheKey,
  eventsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { invalidateQueries } from 'app/utils/react-query';
import {
  emptyResources,
  getMerchantAmount,
  getMerchantMovementDuration,
  getTotalResources,
  resourceTypes,
} from '../utils/resources';
import type { MarketplaceSendResourcesFormValues } from '../utils/schema';
import type { VillageOption } from '../utils/villages';
import { useMarketplaceMerchants } from './use-marketplace-merchants';

type UseSendResourcesFormOptions = {
  initialTargetVillage?: VillageOption;
  onSuccess?: () => void;
};

export const useSendResourcesForm = ({
  initialTargetVillage,
  onSuccess,
}: UseSendResourcesFormOptions = {}) => {
  const { t } = useTranslation();
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const currentVillageState = use(CurrentVillageLiveResourcesContext);
  const { playerVillages } = usePlayerVillageListing();
  const { mapSize, serverSpeed } = useServer();
  const { merchant, marketplaceLevel, availableMerchantAmount } =
    useMarketplaceMerchants();

  const form = useForm<MarketplaceSendResourcesFormValues>({
    defaultValues: {
      resources: emptyResources,
      targetVillageId: initialTargetVillage?.id,
    },
  });
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const selectedResources = form.watch('resources');
  const targetVillageId = form.watch('targetVillageId');

  useEffect(() => {
    form.reset({
      resources: emptyResources,
      targetVillageId: initialTargetVillage?.id,
    });
  }, [form, initialTargetVillage]);

  const targetVillages = useMemo(() => {
    const villages = playerVillages.filter(
      (village) => village.id !== currentVillage.id,
    );

    if (
      initialTargetVillage &&
      !villages.some((village) => village.id === initialTargetVillage.id)
    ) {
      return [...villages, initialTargetVillage];
    }

    return villages;
  }, [currentVillage.id, initialTargetVillage, playerVillages]);

  const targetVillage = useMemo(() => {
    return targetVillages.find((village) => village.id === targetVillageId);
  }, [targetVillageId, targetVillages]);

  const availableResources = useMemo(
    () => ({
      wood: currentVillageState.wood,
      clay: currentVillageState.clay,
      iron: currentVillageState.iron,
      wheat: currentVillageState.wheat,
    }),
    [
      currentVillageState.wood,
      currentVillageState.clay,
      currentVillageState.iron,
      currentVillageState.wheat,
    ],
  );

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
    (resource) => selectedResources[resource] <= availableResources[resource],
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
    onSuccess: async (_, __, ___, context) => {
      form.reset({
        resources: emptyResources,
        targetVillageId: initialTargetVillage?.id,
      });
      setIsConfirmationOpen(false);
      toast.success(t('Resource transfer started'));

      await invalidateQueries(context, [
        [currentVillageCacheKey],
        [eventsCacheKey, 'resourceTransfer', currentVillage.id],
      ]);

      onSuccess?.();
    },
    onError: () => {
      toast.error(t('Resource transfer could not be started'));
    },
  });

  const onFormSubmit = () => {
    if (!canSubmit) {
      return;
    }

    setIsConfirmationOpen(true);
  };

  return {
    availableResources,
    availableMerchantAmount,
    canSubmit,
    closeConfirmationStep: () => setIsConfirmationOpen(false),
    currentVillage,
    duration,
    form,
    isConfirmationOpen,
    isPending,
    marketplaceLevel,
    merchant,
    merchantAmount,
    onConfirm: transferResources,
    onFormSubmit,
    selectedResources,
    targetVillage,
    targetVillages,
    totalCapacity,
  };
};
