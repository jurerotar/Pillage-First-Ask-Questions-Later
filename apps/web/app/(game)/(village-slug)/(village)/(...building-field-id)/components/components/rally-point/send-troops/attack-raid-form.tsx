import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout.tsx';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag.tsx';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event.ts';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences.ts';
import { Text } from 'app/components/text.tsx';
import { Button } from 'app/components/ui/button.tsx';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from 'app/components/ui/form.tsx';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group.tsx';
import { getFormErrorBag } from 'app/utils/forms.ts';
import { CoordinateSelector } from './components/target-selectors.tsx';
import { UnitSelector } from './components/unit-selector.tsx';
import { useTroopForm } from './hooks/use-troop-form.ts';
import { baseTroopFormSchema } from './utils/schema.ts';

const attackRaidFormSchema = baseTroopFormSchema.extend({
  action: z.enum(['attack_normal', 'attack_raid']),
});

export const AttackRaidForm = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const { createEvent: createAttackEvent } = useCreateEvent(
    'troopMovementAttack',
  );
  const { createEvent: createRaidEvent } = useCreateEvent('troopMovementRaid');

  const { form, getBaseEventArgs, resetForm } = useTroopForm(
    attackRaidFormSchema,
    {
      defaultValues: {
        action: 'attack_normal',
      },
    },
  );

  const onFormSubmit = (data: z.infer<typeof attackRaidFormSchema>) => {
    const eventArgs = getBaseEventArgs(data);

    const createEventFn =
      data.action === 'attack_normal' ? createAttackEvent : createRaidEvent;

    createEventFn(eventArgs, {
      onSuccess: () => {
        resetForm();

        if (preferences.isAutomaticNavigationAfterSendUnitsEnabled) {
          navigate('..', { relative: 'path' });
        }
      },
    });
  };

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Attack or raid')}</Text>
      </SectionContent>
      <SectionContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="space-y-6"
          >
            <UnitSelector />

            <div className="flex items-end gap-4">
              <CoordinateSelector />

              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem className="space-y-2 border-l border-border pl-4">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col gap-2"
                      >
                        <FormItem className="flex items-center flex-row space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="attack_normal" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t('Attack: Normal')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
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
            </div>

            <ErrorBag errorBag={getFormErrorBag(form.formState.errors)} />

            <Button type="submit">{t('Confirm')}</Button>
          </form>
        </Form>
      </SectionContent>
    </Section>
  );
};
