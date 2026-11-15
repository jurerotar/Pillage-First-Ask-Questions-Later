import { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from 'app/components/ui/button';
import { FormControl, FormField, FormItem } from 'app/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import type { MarketplaceTradeRouteFormValues } from '../utils/trade-route-form';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => index * 5);

export const TradeRouteStartTimeSelector = () => {
  const { t } = useTranslation();
  const id = useId();
  const form = useFormContext<MarketplaceTradeRouteFormValues>();
  const hours = form.watch('startHour');
  const minutes = form.watch('startMinute');

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-sm font-medium"
      >
        {t('Begin at')}
      </label>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className="bg-emerald-50/50 dark:bg-emerald-950/20"
            >
              {hours.toString().padStart(2, '0')}:
              {minutes.toString().padStart(2, '0')}
            </Button>
          }
        />
        <PopoverContent
          align="start"
          className="w-48 p-3"
          aria-label={t('Begin at')}
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="startHour"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <label
                    htmlFor={`${id}-hours`}
                    className="text-sm font-medium"
                  >
                    {t('Hours')}
                  </label>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) =>
                      field.onChange(Number.parseInt(value, 10))
                    }
                  >
                    <FormControl>
                      <SelectTrigger id={`${id}-hours`}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {HOUR_OPTIONS.map((hour) => (
                        <SelectItem
                          key={hour}
                          value={hour.toString()}
                        >
                          {hour.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startMinute"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <label
                    htmlFor={`${id}-minutes`}
                    className="text-sm font-medium"
                  >
                    {t('Minutes')}
                  </label>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) =>
                      field.onChange(Number.parseInt(value, 10))
                    }
                  >
                    <FormControl>
                      <SelectTrigger id={`${id}-minutes`}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MINUTE_OPTIONS.map((minute) => (
                        <SelectItem
                          key={minute}
                          value={minute.toString()}
                        >
                          {minute.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
