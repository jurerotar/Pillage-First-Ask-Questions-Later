import { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import { resourceTypes } from '../utils/resources';
import type { MarketplaceTradeRouteFormValues } from '../utils/trade-route-form';

export const TradeRouteAdvancedOptions = () => {
  const { t } = useTranslation();
  const id = useId();
  const form = useFormContext<MarketplaceTradeRouteFormValues>();

  return (
    <details className="group border rounded-md p-3">
      <summary className="cursor-pointer font-medium group-open:mb-4">
        {t('Advanced')}
      </summary>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          {t('Minimum resources to keep')}
        </legend>
        <Text className="text-sm text-muted-foreground">
          {t(
            'Only resources above these amounts will be sent, up to the delivery amounts. If nothing can be sent, this departure is skipped.',
          )}
        </Text>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {resourceTypes.map((resource) => (
            <FormField
              key={resource}
              control={form.control}
              name={`minimumResources.${resource}`}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <label
                    htmlFor={`${id}-${resource}`}
                    className="flex items-center gap-1 text-sm"
                  >
                    <Icon
                      type={resource}
                      className="size-5"
                    />
                    {t(`ICONS.${resource}`)}
                  </label>
                  <FormControl>
                    <Input
                      {...field}
                      id={`${id}-${resource}`}
                      type="number"
                      min={0}
                      step={1}
                      value={field.value === 0 ? '' : field.value}
                      placeholder="0"
                      onChange={(event) => {
                        field.onChange(
                          event.target.value === ''
                            ? 0
                            : event.target.valueAsNumber,
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </fieldset>
      <FormField
        control={form.control}
        name="minimumMerchants"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2 mt-4">
            <label
              htmlFor={`${id}-merchants`}
              className="text-sm font-medium"
            >
              {t('Minimum merchants to keep available')}
            </label>
            <Text className="text-sm text-muted-foreground">
              {t(
                'A departure is skipped if it would leave fewer than this many free merchants in the village.',
              )}
            </Text>
            <FormControl>
              <Input
                {...field}
                id={`${id}-merchants`}
                type="number"
                min={0}
                step={1}
                className="max-w-40"
                value={field.value === 0 ? '' : field.value}
                placeholder="0"
                onChange={(event) => {
                  field.onChange(
                    event.target.value === '' ? 0 : event.target.valueAsNumber,
                  );
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </details>
  );
};
