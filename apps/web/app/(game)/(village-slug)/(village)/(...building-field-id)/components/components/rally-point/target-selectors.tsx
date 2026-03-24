import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing.ts';
import { Input } from 'app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import type { SendTroopsFormData } from './send-troops-form';

export const VillageSelector = () => {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext<SendTroopsFormData>();
  const target = watch('target');

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">{t('Village:')}</label>
      <Input
        value={target.type === 'village' ? target.name : ''}
        onChange={(e) => {
          setValue('target', { type: 'village', name: e.target.value });
        }}
        className="w-48 h-8 bg-emerald-50/50 dark:bg-emerald-950/20"
      />
    </div>
  );
};

export const PlayerVillageSelector = () => {
  const { t } = useTranslation();
  const { playerVillages } = usePlayerVillageListing();
  const { watch, setValue } = useFormContext<SendTroopsFormData>();
  const target = watch('target');

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">{t('Village:')}</label>
      <Select
        value={target.type === 'coords' ? `${target.x},${target.y}` : ''}
        onValueChange={(value) => {
          const [x, y] = value.split(',').map((v) => Number.parseInt(v, 10));
          setValue('target', { type: 'coords', x, y });
        }}
      >
        <SelectTrigger className="w-48 h-8 bg-emerald-50/50 dark:bg-emerald-950/20">
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
  );
};

export const CoordinateSelector = () => {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext<SendTroopsFormData>();
  const target = watch('target');

  const xValue = target.type === 'coords' ? target.x : '';
  const yValue = target.type === 'coords' ? target.y : '';

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">{t('X:')}</label>
      <Input
        type="number"
        value={xValue}
        onChange={(e) => {
          const x = Number.parseInt(e.target.value, 10);
          const currentY = target.type === 'coords' ? target.y : 0;
          setValue('target', {
            type: 'coords',
            x: isNaN(x) ? 0 : x,
            y: currentY,
          });
        }}
        className="w-16 h-8 bg-emerald-50/50 dark:bg-emerald-950/20"
      />
      <label className="text-sm font-medium">{t('Y:')}</label>
      <Input
        type="number"
        value={yValue}
        onChange={(e) => {
          const y = Number.parseInt(e.target.value, 10);
          const currentX = target.type === 'coords' ? target.x : 0;
          setValue('target', {
            type: 'coords',
            x: currentX,
            y: isNaN(y) ? 0 : y,
          });
        }}
        className="w-16 h-8 bg-emerald-50/50 dark:bg-emerald-950/20"
      />
    </div>
  );
};
