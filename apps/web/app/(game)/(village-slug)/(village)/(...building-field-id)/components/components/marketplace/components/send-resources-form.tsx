import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@pillage-first/utils/format';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from 'app/components/ui/dialog';
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

type SendResourcesFormState = ReturnType<typeof useSendResourcesForm>;

type SendResourcesFormContentProps = {
  formState: SendResourcesFormState;
  header?: ReactNode;
  isTargetVillageSelectorDisabled?: boolean;
  onCancel?: () => void;
};

export const SendResourcesFormContent = ({
  formState,
  header,
  isTargetVillageSelectorDisabled = false,
  onCancel,
}: SendResourcesFormContentProps) => {
  const { t } = useTranslation();
  const {
    availableMerchantAmount,
    canSubmit,
    currentVillage,
    form,
    marketplaceLevel,
    merchant,
    onFormSubmit,
    selectedResources,
    targetVillages,
    totalCapacity,
  } = formState;

  return (
    <>
      {header}

      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onFormSubmit)}
        >
          <Text className="font-medium">
            {t('Free merchants')}: {formatNumber(availableMerchantAmount)} /{' '}
            {formatNumber(marketplaceLevel)}
          </Text>

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

type SendResourcesConfirmationStepProps = {
  formState: SendResourcesFormState;
  onConfirm?: () => void;
};

export const SendResourcesConfirmationStep = ({
  formState,
  onConfirm,
}: SendResourcesConfirmationStepProps) => {
  const confirmResourceTransfer = () => {
    formState.onConfirm();
    onConfirm?.();
  };

  return (
    <ResourceTransferConfirmationContent
      onBack={formState.closeConfirmationStep}
      onConfirm={confirmResourceTransfer}
      targetVillage={formState.targetVillage}
      resources={formState.selectedResources}
      duration={formState.duration}
      merchantAmount={formState.merchantAmount}
      isPending={formState.isPending}
    />
  );
};

export const SendResourcesForm = ({
  initialTargetVillage,
  isTargetVillageSelectorDisabled = false,
  onCancel,
  onSuccess,
  title,
}: SendResourcesFormProps) => {
  const formState = useSendResourcesForm({ initialTargetVillage, onSuccess });

  return (
    <>
      <SendResourcesFormContent
        formState={formState}
        header={title ? <Text as="h2">{title}</Text> : null}
        isTargetVillageSelectorDisabled={isTargetVillageSelectorDisabled}
        onCancel={onCancel}
      />

      <Dialog
        open={formState.isConfirmationOpen}
        onOpenChange={(open) => !open && formState.closeConfirmationStep()}
      >
        <DialogContent>
          <SendResourcesConfirmationStep formState={formState} />
        </DialogContent>
      </Dialog>
    </>
  );
};
