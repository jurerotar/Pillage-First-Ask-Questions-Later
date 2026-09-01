import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import type { Building } from '@pillage-first/types/models/building';
import type { CatapultTarget } from '@pillage-first/types/models/game-event';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from 'app/components/ui/form';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import type { AttackOrRaidConfirmationOption } from '../hooks/use-attack-or-raid-form';
import type { attackOrRaidFormSchema } from '../utils/schema';

type AttackOrRaidFormValues = z.infer<typeof attackOrRaidFormSchema>;

type AttackOrRaidConfirmationOptionsProps = {
  confirmationOption: AttackOrRaidConfirmationOption | null;
  form: UseFormReturn<AttackOrRaidFormValues, unknown, AttackOrRaidFormValues>;
};

const ScoutingTargetSelector = () => {
  const { t } = useTranslation();

  return (
    <FormField
      name="scoutingTarget"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex flex-col gap-2"
            >
              <FormItem className="flex items-center gap-x-2 gap-y-0">
                <FormControl>
                  <RadioGroupItem value="defensiveStructures" />
                </FormControl>
                <FormLabel className="font-normal">
                  {t('Defensive buildings and troops')}
                </FormLabel>
              </FormItem>
              <FormItem className="flex items-center gap-x-2 gap-y-0">
                <FormControl>
                  <RadioGroupItem value="resources" />
                </FormControl>
                <FormLabel className="font-normal">
                  {t('Resources and troops')}
                </FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

type CatapultTargetSelectorProps = {
  catapultTargetBuildingIds: Building['id'][];
  excludedTarget?: CatapultTarget;
  index: 0 | 1;
};

const CatapultTargetSelector = ({
  catapultTargetBuildingIds,
  excludedTarget,
  index,
}: CatapultTargetSelectorProps) => {
  const { t } = useTranslation();

  return (
    <FormField
      name={`catapultTargets.${index}`}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>
            {index === 0 ? t('Target building') : t('Second target building')}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('Select building')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="random">{t('Random')}</SelectItem>
              {catapultTargetBuildingIds.map((buildingId) => (
                <SelectItem
                  disabled={excludedTarget === buildingId}
                  key={buildingId}
                  value={buildingId}
                >
                  {t(`BUILDINGS.${buildingId}.NAME`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};

const HeroOasisAnimalActionSelector = () => {
  const { t } = useTranslation();

  return (
    <FormField
      name="heroOasisAnimalAction"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex flex-col gap-2"
            >
              <FormItem className="flex items-center gap-x-2 gap-y-0">
                <FormControl>
                  <RadioGroupItem value="battle" />
                </FormControl>
                <FormLabel className="font-normal">
                  {t('Fight the animals')}
                </FormLabel>
              </FormItem>
              <FormItem className="flex items-center gap-x-2 gap-y-0">
                <FormControl>
                  <RadioGroupItem value="capture" />
                </FormControl>
                <FormLabel className="font-normal">
                  {t('Use equipped cages to capture animals')}
                </FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export const AttackOrRaidConfirmationOptions = ({
  confirmationOption,
  form,
}: AttackOrRaidConfirmationOptionsProps) => {
  if (!confirmationOption || confirmationOption.type === 'catapultTargets') {
    return null;
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        {confirmationOption.type === 'scoutingTarget' && (
          <ScoutingTargetSelector />
        )}

        {confirmationOption.type === 'heroOasisAnimalAction' && (
          <HeroOasisAnimalActionSelector />
        )}
      </div>
    </Form>
  );
};

type AttackOrRaidCatapultTargetOptionsProps = {
  catapultTargetBuildingIds: Building['id'][];
  form: UseFormReturn<AttackOrRaidFormValues, unknown, AttackOrRaidFormValues>;
  targetCount: 1 | 2;
};

export const AttackOrRaidCatapultTargetOptions = ({
  catapultTargetBuildingIds,
  form,
  targetCount,
}: AttackOrRaidCatapultTargetOptionsProps) => {
  const catapultTargets = form.watch('catapultTargets') ?? [];

  return (
    <Form {...form}>
      <div className="inline-flex gap-2 w-full">
        <div className="inline-flex w-full">
          <CatapultTargetSelector
            catapultTargetBuildingIds={catapultTargetBuildingIds}
            excludedTarget={catapultTargets[1]}
            index={0}
          />
        </div>
        {targetCount === 2 && (
          <div className="inline-flex w-full">
            <CatapultTargetSelector
              catapultTargetBuildingIds={catapultTargetBuildingIds}
              excludedTarget={catapultTargets[0]}
              index={1}
            />
          </div>
        )}
      </div>
    </Form>
  );
};
