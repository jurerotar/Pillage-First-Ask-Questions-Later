import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing.ts';
import { Input } from 'app/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select.tsx';

type TargetFormValues = {
  target: {
    x?: number;
    y?: number;
  };
};

export const PlayerVillageSelector = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillageListing();
  const { watch, setValue } = useFormContext<TargetFormValues>();
  const target = watch('target');

  const otherVillages = playerVillages.filter(
    (village) => village.id !== currentVillage.id,
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <label
          htmlFor="village-selector"
          className="text-sm font-medium"
        >
          {t('Village:')}
        </label>
        <Select
          value={
            target.x !== undefined && target.y !== undefined
              ? `${target.x},${target.y}`
              : ''
          }
          onValueChange={(value) => {
            const [x, y] = value.split(',').map((v) => Number.parseInt(v, 10));
            setValue('target', { x, y });
          }}
        >
          <SelectTrigger
            id="village-selector"
            className="w-48 h-8 bg-emerald-50/50 dark:bg-emerald-950/20"
          >
            <SelectValue placeholder={t('Select village')} />
          </SelectTrigger>
          <SelectContent>
            {otherVillages.map((village) => (
              <SelectItem
                key={village.id}
                value={`${village.coordinates.x},${village.coordinates.y}`}
              >
                {village.name} ({village.coordinates.x}|{village.coordinates.y})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export const CoordinateSelector = () => {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext<TargetFormValues>();
  const target = watch('target');

  const xValue = target.x ?? '';
  const yValue = target.y ?? '';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4">
        <div className="flex flex-col gap-1 w-20">
          <label
            htmlFor="target-x"
            className="text-xs font-medium text-muted-foreground"
          >
            {t('x coordinate')}
          </label>
          <Input
            id="target-x"
            type="number"
            value={xValue}
            onChange={(e) => {
              const x =
                e.target.value === ''
                  ? undefined
                  : Number.parseInt(e.target.value, 10);
              setValue('target', { ...target, x });
            }}
            className="w-16 h-8 bg-emerald-50/50 dark:bg-emerald-950/20"
          />
        </div>
        <div className="flex flex-col gap-1 w-20">
          <label
            htmlFor="target-y"
            className="text-xs font-medium text-muted-foreground"
          >
            {t('y coordinate')}
          </label>
          <Input
            id="target-y"
            type="number"
            value={yValue}
            onChange={(e) => {
              const y =
                e.target.value === ''
                  ? undefined
                  : Number.parseInt(e.target.value, 10);
              setValue('target', { ...target, y });
            }}
            className="w-16 h-8 bg-emerald-50/50 dark:bg-emerald-950/20"
          />
        </div>
      </div>
    </div>
  );
};
