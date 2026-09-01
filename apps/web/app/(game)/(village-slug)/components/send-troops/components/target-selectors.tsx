import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { Input } from 'app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import {
  createTroopFormTargetFromCoordinates,
  parseOptionalInteger,
} from '../utils/troop-form';

type TargetFormValues = {
  target: {
    tileId?: number;
    x?: number;
    y?: number;
  };
};

type PlayerVillageSelectorProps = {
  disabled?: boolean;
  excludedVillageIds?: number[];
};

export const PlayerVillageSelector = ({
  disabled = false,
  excludedVillageIds = [],
}: PlayerVillageSelectorProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillageListing();
  const { watch, setValue } = useFormContext<TargetFormValues>();
  const target = watch('target');

  const otherVillages = playerVillages.filter(
    (village) =>
      village.id !== currentVillage.id &&
      !excludedVillageIds.includes(village.id),
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
          disabled={disabled}
          value={target.tileId?.toString() ?? ''}
          onValueChange={(value) => {
            const tileId = Number.parseInt(value, 10);
            const village = otherVillages.find(
              (candidate) => candidate.tileId === tileId,
            );

            if (!village) {
              return;
            }

            setValue('target', {
              tileId,
              x: village.coordinates.x,
              y: village.coordinates.y,
            });
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
                value={village.tileId.toString()}
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

type CoordinateSelectorProps = {
  disabled?: boolean;
};

export const CoordinateSelector = ({
  disabled = false,
}: CoordinateSelectorProps) => {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext<TargetFormValues>();
  const { mapSize } = useServer();
  const target = watch('target');

  const coordinateRadius = mapSize / 2;
  const minCoordinate = Math.ceil(-coordinateRadius);
  const maxCoordinate = Math.floor(coordinateRadius);
  const xValue = target.x ?? '';
  const yValue = target.y ?? '';

  const clampCoordinate = (coordinate: number | undefined) => {
    if (coordinate === undefined) {
      return undefined;
    }

    return Math.min(Math.max(coordinate, minCoordinate), maxCoordinate);
  };

  const updateTarget = (nextTarget: TargetFormValues['target']) => {
    const targetFromCoordinates = createTroopFormTargetFromCoordinates(
      nextTarget,
      mapSize,
    );

    setValue('target', {
      ...nextTarget,
      tileId: targetFromCoordinates.tileId,
    });
  };

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
            disabled={disabled}
            min={minCoordinate}
            max={maxCoordinate}
            step={1}
            value={xValue}
            onChange={(e) => {
              const x = clampCoordinate(parseOptionalInteger(e.target.value));
              updateTarget({ ...target, x });
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
            disabled={disabled}
            min={minCoordinate}
            max={maxCoordinate}
            step={1}
            value={yValue}
            onChange={(e) => {
              const y = clampCoordinate(parseOptionalInteger(e.target.value));
              updateTarget({ ...target, y });
            }}
            className="w-16 h-8 bg-emerald-50/50 dark:bg-emerald-950/20"
          />
        </div>
      </div>
    </div>
  );
};
