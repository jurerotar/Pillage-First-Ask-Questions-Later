import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { Unit } from '@pillage-first/types/models/unit';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group';
import {
  CoordinateSelector,
  PlayerVillageSelector,
  VillageSelector,
} from './target-selectors';
import { UnitSelector } from './unit-selector';

const unitSelectionSchema = z.strictObject({
  unitId: z.string(),
  selected: z.coerce.number().int().nonnegative().default(0),
  available: z.number().int().nonnegative(),
  category: z.string().optional(),
});

const targetSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('village'),
    name: z.string().min(1, 'Village name is required'),
  }),
  z.strictObject({
    type: z.literal('coords'),
    x: z.coerce.number().int(),
    y: z.coerce.number().int(),
  }),
]);

const actionTypeSchema = z.enum([
  'reinforcement',
  'attack_normal',
  'attack_raid',
  'relocation',
  'found_new_village',
  'oasis_occupation',
]);

const sendTroopsFormSchema = z
  .strictObject({
    units: z.array(unitSelectionSchema),
    action: actionTypeSchema,
    target: targetSchema,
  })
  .refine(
    (data) => {
      return data.units.some((u) => u.selected > 0);
    },
    {
      message: 'At least 1 troop must be selected',
      path: ['units'],
    },
  )
  .refine(
    (data) => {
      return data.units.every((u) => u.selected <= u.available);
    },
    {
      message: 'Selected units cannot exceed available count',
      path: ['units'],
    },
  );

export type UnitSelection = z.infer<typeof unitSelectionSchema>;
export type ActionType = z.infer<typeof actionTypeSchema>;
export type Target = z.infer<typeof targetSchema>;
export type SendTroopsFormData = z.infer<typeof sendTroopsFormSchema>;

interface SendTroopsFormProps {
  initialUnits: UnitSelection[];
  onSubmit: (data: SendTroopsFormData) => void;
  disabledUnitCategories?: Unit['category'][];
  defaultAction?: ActionType;
}

export const SendTroopsForm = ({
  initialUnits,
  onSubmit,
  disabledUnitCategories = [],
  defaultAction = 'attack_normal',
}: SendTroopsFormProps) => {
  const { t } = useTranslation();
  const { playerVillages } = usePlayerVillageListing();

  const form = useForm<SendTroopsFormData>({
    resolver: zodResolver(sendTroopsFormSchema),
    defaultValues: {
      units: initialUnits,
      action: defaultAction,
      target: { type: 'coords', x: 0, y: 0 },
    },
  });

  useEffect(() => {
    form.reset({
      ...form.getValues(),
      action: defaultAction,
    });
  }, [defaultAction, form]);

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = form;

  const currentAction = watch('action');

  const onFormSubmit = (data: SendTroopsFormData) => {
    if (data.action === 'reinforcement' || data.action === 'relocation') {
      const isTargetingOwnVillage =
        data.target.type === 'village' ||
        playerVillages.some(
          (v) =>
            v.coordinates.x === (data.target as any).x &&
            v.coordinates.y === (data.target as any).y,
        );

      if (!isTargetingOwnVillage) {
        setError('target', {
          type: 'manual',
          message: t(
            'Reinforcements and relocations can only be sent to your own villages',
          ),
        });
        return;
      }
    }

    onSubmit(data);
  };

  const isAttackOrRaid =
    currentAction === 'attack_normal' || currentAction === 'attack_raid';
  const isReinforceOrRelocate =
    currentAction === 'reinforcement' || currentAction === 'relocation';
  const isFoundOrOccupy =
    currentAction === 'found_new_village' ||
    currentAction === 'oasis_occupation';

  return (
    <div className="bg-gray-100 dark:bg-muted/30 border border-gray-300 dark:border-border p-4 rounded-md">
      <Text
        as="h2"
        className="text-xl font-bold mb-4"
      >
        {t('Send troops')}
      </Text>

      <Form {...form}>
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="space-y-6"
        >
          {/* Troop Selection Grid */}
          <UnitSelector
            units={initialUnits}
            disabledUnitCategories={disabledUnitCategories}
          />
          {errors.units && (
            <p className="text-destructive text-sm">{errors.units.message}</p>
          )}

          <div className="flex flex-wrap gap-8 items-start">
            {/* Action Type Selection */}
            <FormField
              control={control}
              name="action"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {isReinforceOrRelocate && (
                        <>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="reinforcement" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t('Reinforcement')}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="relocation" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t('Relocation')}
                            </FormLabel>
                          </FormItem>
                        </>
                      )}
                      {isAttackOrRaid && (
                        <>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="attack_normal" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t('Attack: Normal')}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="attack_raid" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t('Attack: Raid')}
                            </FormLabel>
                          </FormItem>
                        </>
                      )}
                      {currentAction === 'found_new_village' && (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="found_new_village" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t('Found new village')}
                          </FormLabel>
                        </FormItem>
                      )}
                      {currentAction === 'oasis_occupation' && (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="oasis_occupation" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t('Oasis occupation')}
                          </FormLabel>
                        </FormItem>
                      )}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Selection */}
            <div className="flex items-center gap-4 border-l dark:border-border pl-8 min-h-24">
              <div className="space-y-4">
                {isReinforceOrRelocate && (
                  <>
                    <PlayerVillageSelector />
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic px-4">
                      {t('or')}
                    </div>
                    <CoordinateSelector />
                  </>
                )}

                {isAttackOrRaid && (
                  <>
                    <VillageSelector />
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic px-4">
                      {t('or')}
                    </div>
                    <CoordinateSelector />
                  </>
                )}

                {isFoundOrOccupy && <CoordinateSelector />}

                {errors.target && (
                  <p className="text-destructive text-sm">
                    {(errors.target as any).message ||
                      (errors.target as any).name?.message ||
                      (errors.target as any).x?.message ||
                      (errors.target as any).y?.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white rounded-md px-8"
          >
            {t('OK')}
          </Button>
        </form>
      </Form>
    </div>
  );
};
