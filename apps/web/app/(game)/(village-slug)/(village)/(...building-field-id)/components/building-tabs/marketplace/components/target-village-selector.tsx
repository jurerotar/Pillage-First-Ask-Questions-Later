import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormControl, FormField, FormItem } from 'app/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import type { MarketplaceSendResourcesFormValues } from '../utils/schema';
import type { VillageOption } from '../utils/villages';
import { VillageLabel } from './village-label';

type TargetVillageSelectorProps = {
  disabled?: boolean;
  targetVillages: VillageOption[];
};

export const TargetVillageSelector = ({
  disabled = false,
  targetVillages,
}: TargetVillageSelectorProps) => {
  const { t } = useTranslation();
  const form = useFormContext<MarketplaceSendResourcesFormValues>();

  return (
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
            disabled={disabled}
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
  );
};
