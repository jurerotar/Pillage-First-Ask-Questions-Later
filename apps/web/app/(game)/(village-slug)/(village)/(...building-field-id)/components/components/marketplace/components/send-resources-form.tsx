import { useTranslation } from 'react-i18next';
import { formatNumber } from '@pillage-first/utils/format';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Form } from 'app/components/ui/form';
import { useSendResourcesForm } from '../hooks/use-send-resources-form';
import type { VillageOption } from '../utils/villages';
import { ResourceTransferConfirmationContent } from './confirmation-modal';
import { ResourceSelector } from './resource-selector';
import { TargetVillageSelector } from './target-village-selector';

type SendResourcesFormProps = {
  initialTargetVillage?: VillageOption;
  isTargetVillageSelectorDisabled?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
  title?: string;
};

export const SendResourcesForm = ({
  initialTargetVillage,
  isTargetVillageSelectorDisabled = false,
  onCancel,
  onSuccess,
  title,
}: SendResourcesFormProps) => {
  const { t } = useTranslation();
  const {
    availableMerchantAmount,
    canSubmit,
    closeConfirmationStep,
    currentVillage,
    duration,
    form,
    isConfirmationOpen,
    isPending,
    marketplaceLevel,
    merchant,
    merchantAmount,
    onConfirm,
    onFormSubmit,
    selectedResources,
    targetVillage,
    targetVillages,
    totalCapacity,
  } = useSendResourcesForm({ initialTargetVillage, onSuccess });

  if (isConfirmationOpen) {
    return (
      <ResourceTransferConfirmationContent
        onBack={closeConfirmationStep}
        onConfirm={() => onConfirm()}
        targetVillage={targetVillage}
        resources={selectedResources}
        duration={duration}
        merchantAmount={merchantAmount}
        isPending={isPending}
      />
    );
  }

  return (
    <>
      {title ? (
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
      ) : null}

      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onFormSubmit)}
        >
          <div className="flex flex-col gap-2">
            <Text className="font-medium">
              {t('Free merchants')}: {formatNumber(availableMerchantAmount)} /{' '}
              {formatNumber(marketplaceLevel)}
            </Text>
          </div>

          <ResourceSelector
            availableResources={currentVillage.resources}
            merchantCapacity={merchant.merchantCapacity}
            selectedResources={selectedResources}
            totalCapacity={totalCapacity}
          />

          <TargetVillageSelector
            disabled={isTargetVillageSelectorDisabled}
            targetVillages={targetVillages}
          />

          <DialogFooter>
            {onCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                {t('Cancel')}
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={!canSubmit}
            >
              {t('Send resources')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};
