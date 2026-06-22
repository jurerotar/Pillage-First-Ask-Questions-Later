import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type {
  Resource,
  Resources as ResourcesType,
} from '@pillage-first/types/models/resource';
import { formatNumber } from '@pillage-first/utils/format';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { FormControl, FormField, FormItem } from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import {
  clampResourceAmount,
  getResourceInputMax,
  resourceTypes,
} from '../utils/resources';
import type { MarketplaceSendResourcesFormValues } from '../utils/schema';

type ResourceSelectorProps = {
  availableLabel?: string;
  availableResources: ResourcesType;
  merchantCapacity: number;
  selectedResources: ResourcesType;
  totalCapacity: number;
};

export const ResourceSelector = ({
  availableLabel,
  availableResources,
  merchantCapacity,
  selectedResources,
  totalCapacity,
}: ResourceSelectorProps) => {
  const { t } = useTranslation();
  const form = useFormContext<MarketplaceSendResourcesFormValues>();
  const resolvedAvailableLabel = availableLabel ?? t('Available');

  const setResourceAmount = (resource: Resource, value: number) => {
    form.setValue(`resources.${resource}`, value);
  };

  const incrementResourceAmount = (resource: Resource, maxAmount: number) => {
    setResourceAmount(
      resource,
      Math.min(selectedResources[resource] + merchantCapacity, maxAmount),
    );
  };

  const decrementResourceAmount = (resource: Resource) => {
    setResourceAmount(
      resource,
      Math.max(0, selectedResources[resource] - merchantCapacity),
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {resourceTypes.map((resource) => {
        const maxAmount = getResourceInputMax({
          availableResources,
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
                        clampResourceAmount(event.target.value, maxAmount),
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
                    - {merchantCapacity}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="fit"
                    className="text-xs p-1!"
                    disabled={maxAmount === 0 || selectedAmount >= maxAmount}
                    onClick={() => incrementResourceAmount(resource, maxAmount)}
                  >
                    + {merchantCapacity}
                  </Button>
                </div>
                <Text className="text-xs text-muted-foreground">
                  {resolvedAvailableLabel}:{' '}
                  {formatNumber(availableResources[resource])}
                </Text>
              </FormItem>
            )}
          />
        );
      })}
    </div>
  );
};
