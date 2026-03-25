import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing.ts';
import { Input } from 'app/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select.tsx';

interface TargetFormValues {
  target: {
    x: number;
    y: number;
  };
  'target.x': number;
  'target.y': number;
}

export const PlayerVillageSelector = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { playerVillages } = usePlayerVillageListing();
  const { watch, setValue } = useFormContext<TargetFormValues>();
  const target = watch('target');

  useEffect(() => {
    const villageIdParam = searchParams.get('villageId');

    if (villageIdParam !== null) {
      const villageId = Number.parseInt(villageIdParam, 10);
      const village = playerVillages.find((v) => v.id === villageId);

      if (village) {
        const { x, y } = village.coordinates;
        if (target.x !== x || target.y !== y) {
          setValue('target', { x, y });
        }
      }
    }
  }, [searchParams, playerVillages, setValue, target]);

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
          value={`${target.x},${target.y}`}
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
            {playerVillages.map((village) => (
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
  const [searchParams] = useSearchParams();
  const { watch, setValue } = useFormContext<TargetFormValues>();
  const target = watch('target');

  useEffect(() => {
    const xParam = searchParams.get('x');
    const yParam = searchParams.get('y');

    if (xParam !== null || yParam !== null) {
      const x = xParam !== null ? Number.parseInt(xParam, 10) : target.x;
      const y = yParam !== null ? Number.parseInt(yParam, 10) : target.y;

      if (!Number.isNaN(x) && !Number.isNaN(y)) {
        if (target.x !== x || target.y !== y) {
          setValue('target', { x, y });
        }
      }
    }
  }, [searchParams, setValue, target]);

  const xValue = target.x;
  const yValue = target.y;

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
              const x = Number.parseInt(e.target.value, 10);
              const currentY = target.y;
              setValue('target', {
                x: Number.isNaN(x) ? 0 : x,
                y: currentY,
              });
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
              const y = Number.parseInt(e.target.value, 10);
              const currentX = target.x;
              setValue('target', {
                x: currentX,
                y: Number.isNaN(y) ? 0 : y,
              });
            }}
            className="w-16 h-8 bg-emerald-50/50 dark:bg-emerald-950/20"
          />
        </div>
      </div>
    </div>
  );
};
