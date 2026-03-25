import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout.tsx';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag.tsx';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event.ts';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing.ts';
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
import { PlayerVillageSelector } from './components/target-selectors.tsx';
import { UnitSelector } from './components/unit-selector.tsx';
import { useTroopForm } from './hooks/use-troop-form.ts';
import { baseTroopFormSchema } from './utils/schema.ts';

const reinforcementRelocationFormSchema = baseTroopFormSchema.extend({
  action: z.enum(['reinforcement', 'relocation']),
});

export const ReinforcementRelocationForm = () => {
  const { t } = useTranslation();
  const { playerVillages } = usePlayerVillageListing();
  const { createEvent: createReinforcementEvent } = useCreateEvent(
    'troopMovementReinforcements',
  );
  const { createEvent: createRelocationEvent } = useCreateEvent(
    'troopMovementRelocation',
  );

  const { form, getBaseEventArgs } = useTroopForm(
    reinforcementRelocationFormSchema,
    {
      action: 'reinforcement',
      target: { x: 0, y: 0 },
    },
  );

  const onFormSubmit = (
    data: z.infer<typeof reinforcementRelocationFormSchema>,
  ) => {
    const isTargetingOwnVillage = playerVillages.some(
      (v) =>
        v.coordinates.x === data.target.x && v.coordinates.y === data.target.y,
    );

    if (!isTargetingOwnVillage) {
      form.setError('target', {
        type: 'manual',
        message: t(
          'Reinforcements and relocations can only be sent to your own villages',
        ),
      });
      return;
    }

    const eventArgs = getBaseEventArgs(data);

    if (data.action === 'reinforcement') {
      createReinforcementEvent(eventArgs);
    } else {
      createRelocationEvent(eventArgs);
    }
  };

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
                  <FormItem className="space-y-4 border-l dark:border-border pl-4">
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
      </SectionContent>
    </Section>
  );
};
