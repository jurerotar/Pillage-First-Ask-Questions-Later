import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from 'app/components/ui/form';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group';
import { getFormErrorBag } from 'app/utils/forms';
import { TroopMovementConfirmationModal } from './components/confirmation-modal';
import { PlayerVillageSelector } from './components/target-selectors';
import { UnitSelector } from './components/unit-selector';
import { useReinforcementRelocationTroopForm } from './hooks/use-reinforcement-relocation-troop-form';

export const ReinforcementRelocationForm = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const {
    closeConfirmationModal,
    form,
    formData,
    isConfirmationModalOpen,
    onConfirm,
    onFormSubmit,
    tribe,
  } = useReinforcementRelocationTroopForm({
    onSuccess: () => {
      if (preferences.isAutomaticNavigationAfterSendUnitsEnabled) {
        navigate('..', { relative: 'path' });
      }
    },
  });

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Reinforce or relocate')}</Text>
      </SectionContent>
      <SectionContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="space-y-6"
          >
            <UnitSelector />

            <div className="flex items-end gap-4">
              <PlayerVillageSelector />

              <FormField
                control={form.control}
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
                        <FormItem className="flex items-center space-x-4 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="relocation" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t('Relocation')}
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <ErrorBag errorBag={getFormErrorBag(form.formState.errors)} />

            <Button type="submit">{t('Confirm')}</Button>
          </form>
        </Form>

        {formData.current && (
          <TroopMovementConfirmationModal
            isOpen={isConfirmationModalOpen}
            onClose={closeConfirmationModal}
            onConfirm={onConfirm}
            formData={formData.current}
            tribe={tribe}
            title={
              formData.current.action === 'reinforcement'
                ? t('Reinforcement')
                : t('Relocation')
            }
          />
        )}
      </SectionContent>
    </Section>
  );
};
