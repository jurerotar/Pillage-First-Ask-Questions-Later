import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import { unitIdSchema, unitTierSchema } from '@pillage-first/types/models/unit';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout.tsx';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag.tsx';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event.ts';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing.ts';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe.ts';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops.ts';
import { villageTroopsCacheKey } from 'app/(game)/constants/query-keys.ts';
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
import { PlayerVillageSelector } from './components/target-selectors.tsx';
import { UnitSelector } from './components/unit-selector.tsx';

const unitSelectionSchema = z.strictObject({
  unitId: unitIdSchema,
  selected: z.coerce.number().int().nonnegative().default(0),
  available: z.number().int().nonnegative(),
  tier: unitTierSchema,
  category: z.string(),
});

const targetSchema = z.strictObject({
  x: z.coerce.number().int(),
  y: z.coerce.number().int(),
});

const reinforcementRelocationFormSchema = z
  .strictObject({
    units: z.array(unitSelectionSchema),
    action: z.enum(['reinforcement', 'relocation']),
    target: targetSchema,
  })
  .refine((data) => data.units.some((u) => u.selected > 0), {
    message: 'At least 1 troop must be selected',
    path: ['units'],
  })
  .refine((data) => data.units.every((u) => u.selected <= u.available), {
    message: 'Selected units cannot exceed available count',
    path: ['units'],
  });

type ReinforcementRelocationFormData = z.infer<
  typeof reinforcementRelocationFormSchema
>;

export const ReinforcementRelocationForm = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const tribe = useTribe();
  const { getDeployableTroops } = useVillageTroops();
  const { playerVillages } = usePlayerVillageListing();
  const { createEvent: createReinforcementEvent } = useCreateEvent(
    'troopMovementReinforcements',
  );
  const { createEvent: createRelocationEvent } = useCreateEvent(
    'troopMovementRelocation',
  );

  const deployableTroops = useMemo(() => {
    return getDeployableTroops();
  }, [getDeployableTroops]);

  const initialUnits = useMemo(() => {
    const tribeUnits = [...getUnitsByTribe(tribe), getUnitDefinition('HERO')];

    return tribeUnits.map((unitDef) => {
      const troop = deployableTroops.find((t) => t.unitId === unitDef.id);

      return {
        unitId: unitDef.id,
        available: troop?.amount ?? 0,
        selected: 0,
        tier: unitDef.tier,
        category: unitDef.category,
      };
    });
  }, [deployableTroops, tribe]);

  const form = useForm<ReinforcementRelocationFormData>({
    resolver: zodResolver(reinforcementRelocationFormSchema) as any,
    defaultValues: {
      units: initialUnits,
      action: 'reinforcement',
      target: { x: 0, y: 0 },
    },
  });

  useEffect(() => {
    form.reset({
      ...form.getValues(),
      units: initialUnits,
    });
  }, [form, initialUnits]);

  const onFormSubmit = (data: ReinforcementRelocationFormData) => {
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

    const troops = data.units
      .filter((u) => u.selected > 0)
      .map((u) => ({
        unitId: u.unitId,
        amount: u.selected,
        tileId: currentVillage.tileId,
        source: currentVillage.id,
      }));

    const eventArgs = {
      troops,
      coordinates: { x: data.target.x, y: data.target.y },
      cachesToClearImmediately: [villageTroopsCacheKey],
    };

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

            <ErrorBag
              errorBag={Object.entries(form.formState.errors).flatMap(
                ([_, error]) => {
                  if (!error) {
                    return [];
                  }
                  if ('message' in error && error.message) {
                    return [error.message.toString()];
                  }
                  return Object.values(error)
                    .map((nested) =>
                      nested && 'message' in nested
                        ? nested.message?.toString()
                        : undefined,
                    )
                    .filter((m): m is string => !!m);
                },
              )}
            />

            <Button type="submit">{t('Confirm')}</Button>
          </form>
        </Form>
      </SectionContent>
    </Section>
  );
};
