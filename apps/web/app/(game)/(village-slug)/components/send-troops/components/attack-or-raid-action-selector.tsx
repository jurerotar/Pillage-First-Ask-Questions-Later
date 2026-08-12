import { useTranslation } from 'react-i18next';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from 'app/components/ui/form';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group';

type ArrackOrRaidActionSelectorProps = {
  isDisabled?: boolean;
};

export const AttackOrRaidActionSelector = ({
  isDisabled = false,
}: ArrackOrRaidActionSelectorProps) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="action"
      render={({ field }) => (
        <FormItem className="space-y-2 border-l dark:border-border pl-4">
          <FormLabel>{t('Action')}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={isDisabled}
              className="flex flex-col space-y-2"
            >
              <FormItem className="flex items-center space-x-4 space-y-0">
                <FormControl>
                  <RadioGroupItem value="attack" />
                </FormControl>
                <FormLabel className="font-normal">{t('Attack')}</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-4 space-y-0">
                <FormControl>
                  <RadioGroupItem value="raid" />
                </FormControl>
                <FormLabel className="font-normal">{t('Raid')}</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
};
