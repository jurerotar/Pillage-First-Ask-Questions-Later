import { type DefaultValues, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from 'app/components/ui/form';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group';
import { TroopMovementConfirmationModal } from './components/confirmation-modal';
import { TroopSelectionForm } from './components/troop-selection-form';
import { disabledAttackOrRaidUnitTiers } from './hooks/use-attack-or-raid-form';
import { useTroopMovementForm } from './hooks/use-troop-movement-form';
import { baseTroopFormSchema } from './utils/schema';

const attackRaidFormSchema = baseTroopFormSchema.extend({
  action: z.enum(['attack_normal', 'attack_raid']),
});

type AttackRaidFormValues = z.infer<typeof attackRaidFormSchema>;

const attackRaidDefaultValues = {
  action: 'attack_normal',
} satisfies DefaultValues<AttackRaidFormValues>;

const AttackRaidActionSelector = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<AttackRaidFormValues>();

  return (
    <FormField
      control={control}
      name="action"
      render={({ field }) => (
        <FormItem className="space-y-2 border-l border-border pl-4">
          <FormLabel>{t('Action')}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-col gap-2"
            >
              <FormItem className="flex items-center flex-row gap-x-2 gap-y-0">
                <FormControl>
                  <RadioGroupItem value="attack_normal" />
                </FormControl>
                <FormLabel className="font-normal">
                  {t('Attack: Normal')}
                </FormLabel>
              </FormItem>
              <FormItem className="flex items-center gap-x-2 gap-y-0">
                <FormControl>
                  <RadioGroupItem value="attack_raid" />
                </FormControl>
                <FormLabel className="font-normal">
                  {t('Attack: Raid')}
                </FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export const AttackRaidForm = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const tribe = useTribe();
  const {
    closeConfirmationStep,
    form,
    formData,
    isConfirmationStepOpen,
    onConfirm,
    onFormSubmit,
  } = useTroopMovementForm({
    schema: attackRaidFormSchema,
    formOptions: {
      defaultValues: attackRaidDefaultValues,
    },
    getMovementValidationType: (data) =>
      data.action === 'attack_normal' ? 'attack' : 'raid',
    getEventType: (data) =>
      data.action === 'attack_normal'
        ? 'troopMovementAttack'
        : 'troopMovementRaid',
    onSuccess: () => {
      if (preferences.isAutomaticNavigationAfterSendUnitsEnabled) {
        navigate('..', { relative: 'path' });
      }
    },
  });

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Attack or raid')}</Text>
      </SectionContent>
      <SectionContent>
        <TroopSelectionForm
          form={form}
          onSubmit={onFormSubmit}
          targetSelector="coordinates"
          disabledUnitTiers={disabledAttackOrRaidUnitTiers}
          extraTargetContent={<AttackRaidActionSelector />}
          actions={<Button type="submit">{t('Confirm')}</Button>}
        />
        {formData.current ? (
          <TroopMovementConfirmationModal
            isOpen={isConfirmationStepOpen}
            onClose={closeConfirmationStep}
            onConfirm={onConfirm}
            formData={formData.current}
            tribe={tribe}
            title={
              formData.current.action === 'attack_normal'
                ? t('Attack: Normal')
                : t('Attack: Raid')
            }
            backLabel={t('Back')}
          />
        ) : null}
      </SectionContent>
    </Section>
  );
};
