import { useTranslation } from 'react-i18next';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from 'app/components/ui/form';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group';

type ReinforcementRelocationActionSelectorProps = {
  isRelocationEnabled?: boolean;
};

export const ReinforcementRelocationActionSelector = ({
  isRelocationEnabled = true,
}: ReinforcementRelocationActionSelectorProps) => {
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
              className="flex flex-col space-y-2"
            >
              <FormItem className="flex items-center space-x-4 space-y-0">
                <FormControl>
                  <RadioGroupItem value="reinforcement" />
                </FormControl>
                <FormLabel className="font-normal">
                  {t('Reinforcement')}
                </FormLabel>
              </FormItem>
              {isRelocationEnabled && (
                <FormItem className="flex items-center space-x-4 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="relocation" />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {t('Relocation')}
                  </FormLabel>
                </FormItem>
              )}
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
};
