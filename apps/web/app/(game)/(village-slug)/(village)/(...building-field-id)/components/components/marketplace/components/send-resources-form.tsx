import { useTranslation } from 'react-i18next';
import type { Resource } from '@pillage-first/types/models/resource';
import { formatNumber } from '@pillage-first/utils/format';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
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
import { useSendResourcesForm } from '../hooks/use-send-resources-form';
import {
  clampResourceAmount,
  getResourceInputMax,
  resourceTypes,
} from '../utils/resources';
import type { VillageOption } from '../utils/villages';
import { ResourceTransferConfirmationContent } from './confirmation-modal';
import { VillageLabel } from './village-label';

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
    decrementResourceAmount,
    duration,
    form,
    incrementResourceAmount,
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

  const setResourceAmount = (resource: Resource, value: number) => {
    form.setValue(`resources.${resource}`, value);
  };

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
                          onClick={() => setResourceAmount(resource, maxAmount)}
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
                          className="text-xs p-1!"
                          disabled={selectedAmount <= 0}
                          onClick={() => decrementResourceAmount(resource)}
                        >
                          - {merchant.merchantCapacity}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="fit"
                          className="text-xs p-1!"
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
                  disabled={isTargetVillageSelectorDisabled}
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
