import { useMutation, useQueryClient } from '@tanstack/react-query';
import { use, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Resource } from '@pillage-first/types/models/resource';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import {
  currentVillageCacheKey,
  eventsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
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
  const queryClient = useQueryClient();
  const { currentVillage } = useCurrentVillage();
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
        targetVillageId: initialTargetVillage?.id,
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

      onSuccess?.();
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

  const onFormSubmit = () => {
    if (!canSubmit) {
      return;
    }

    setIsConfirmationOpen(true);
  };

  return {
    availableMerchantAmount,
    canSubmit,
    closeConfirmationStep: () => setIsConfirmationOpen(false),
    currentVillage,
    decrementResourceAmount,
    duration,
    form,
    incrementResourceAmount,
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
    totalSelectedResources,
  };
};
