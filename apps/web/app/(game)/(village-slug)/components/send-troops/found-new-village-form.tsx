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
import { Form } from 'app/components/ui/form';
import { getFormErrorBag } from 'app/utils/forms';
import { TroopMovementConfirmationContent } from './components/confirmation-modal';
import { CoordinateSelector } from './components/target-selectors';
import { UnitSelector } from './components/unit-selector';
import { useFoundNewVillageTroopForm } from './hooks/use-found-new-village-troop-form';

export const FoundNewVillageForm = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const {
    closeConfirmationStep,
    disabledUnitTiers,
    form,
    formData,
    isConfirmationStepOpen,
    maxUnits,
    onConfirm,
    onFormSubmit,
    tribe,
  } = useFoundNewVillageTroopForm({
    onSuccess: () => {
      if (preferences.isAutomaticNavigationAfterSendUnitsEnabled) {
        navigate('..', { relative: 'path' });
      }
    },
  });

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Found a new village')}</Text>
      </SectionContent>
      <SectionContent>
        {isConfirmationStepOpen && formData.current ? (
          <TroopMovementConfirmationContent
            onBack={closeConfirmationStep}
            onConfirm={onConfirm}
            formData={formData.current}
            title={t('Found a new village')}
            tribe={tribe}
            backLabel={t('Back')}
          />
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onFormSubmit)}
              className="space-y-6"
            >
              <UnitSelector
                disabledUnitTiers={disabledUnitTiers}
                maxUnits={maxUnits}
              />

              <div className="flex items-end gap-8">
                <CoordinateSelector />
              </div>

              <ErrorBag errorBag={getFormErrorBag(form.formState.errors)} />

              <Button type="submit">{t('Confirm')}</Button>
            </form>
          </Form>
        )}
      </SectionContent>
    </Section>
  );
};
