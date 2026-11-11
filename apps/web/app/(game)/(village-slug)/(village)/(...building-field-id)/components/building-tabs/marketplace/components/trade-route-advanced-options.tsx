import { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuChevronDown } from 'react-icons/lu';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import { resourceTypes } from '../utils/resources';
import type { MarketplaceTradeRouteFormValues } from '../utils/trade-route-form';

export const TradeRouteAdvancedOptions = ({
  marketplaceLevel,
}: {
  marketplaceLevel: number;
}) => {
  const { t } = useTranslation();
  const id = useId();
  const form = useFormContext<MarketplaceTradeRouteFormValues>();

  return (
    <details className="group">
      <summary className="flex items-center gap-2 cursor-pointer list-none font-medium group-open:mb-4 [&::-webkit-details-marker]:hidden">
        {t('Advanced')}
        <LuChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
        />
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
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="fit"
                      className="text-xs p-1!"
                      disabled={field.value <= 0}
                      onClick={() =>
                        field.onChange(Math.max(0, field.value - 500))
                      }
                    >
                      - 500
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="fit"
                      className="text-xs p-1!"
                      onClick={() => field.onChange(field.value + 500)}
                    >
                      + 500
                    </Button>
                  </div>
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
                max={marketplaceLevel}
                step={1}
                className="max-w-20 self-start"
                value={field.value === 0 ? '' : field.value}
                placeholder="0"
                onChange={(event) => {
                  field.onChange(
                    event.target.value === ''
                      ? 0
                      : Math.min(
                          marketplaceLevel,
                          Math.max(0, event.target.valueAsNumber),
                        ),
                  );
                }}
              />
            </FormControl>
            <div className="flex justify-between w-20">
              <Button
                type="button"
                variant="outline"
                size="fit"
                className="text-xs p-1!"
                disabled={field.value <= 0}
                onClick={() => field.onChange(Math.max(0, field.value - 1))}
              >
                - 1
              </Button>
              <Button
                type="button"
                variant="outline"
                size="fit"
                className="text-xs p-1!"
                disabled={field.value >= marketplaceLevel}
                onClick={() =>
                  field.onChange(Math.min(marketplaceLevel, field.value + 1))
                }
              >
                + 1
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </details>
  );
};
