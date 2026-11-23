import { useId } from 'react';
import { LuListFilter } from 'react-icons/lu';
import { mapSizeSchema, speedSchema } from '@pillage-first/types/models/server';
import { PLAYABLE_TRIBES } from '@pillage-first/types/models/tribe';
import { Badge } from 'app/components/ui/badge';
import { Button } from 'app/components/ui/button';
import { Checkbox } from 'app/components/ui/checkbox';
import { Label } from 'app/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';

const filterGroups = [
  {
    key: 'mapSize',
    label: 'Map size',
    options: mapSizeSchema.options.map(({ value }) => ({
      value: String(value),
      label: `${value}x${value}`,
    })),
  },
  {
    key: 'speed',
    label: 'Speed',
    options: speedSchema.options.map(({ value }) => ({
      value: String(value),
      label: `${value}x`,
    })),
  },
  {
    key: 'tribe',
    label: 'Tribe',
    options: PLAYABLE_TRIBES.map((tribe) => ({ value: tribe, label: tribe })),
  },
] as const;

export type GameWorldFilterSelection = Record<
  (typeof filterGroups)[number]['key'],
  string[]
>;

type GameWorldFiltersProps = {
  filters: GameWorldFilterSelection;
  onChange: (filters: GameWorldFilterSelection) => void;
};

export const GameWorldFilters = ({
  filters,
  onChange,
}: GameWorldFiltersProps) => {
  const id = useId();
  const activeCount =
    filters.mapSize.length + filters.speed.length + filters.tribe.length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
          >
            <LuListFilter className="size-4" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary">{activeCount}</Badge>
            )}
          </Button>
        }
      />
      <PopoverContent
        aria-label="Game world filters"
        align="start"
        className="max-h-(--available-height) w-80 max-w-[calc(100vw-1rem)] overflow-y-auto p-3"
      >
        <div className="grid grid-cols-3 gap-2">
          {filterGroups.map(({ key, label, options }) => (
            <fieldset key={key}>
              <legend className="mb-1 text-sm font-semibold">{label}</legend>
              {options.map((option) => {
                const checkboxId = `${id}-${key}-${option.value}`;
                return (
                  <div
                    className="flex items-center gap-2 rounded-sm p-1 hover:bg-accent"
                    key={option.value}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={filters[key].includes(option.value)}
                      onCheckedChange={(checked) =>
                        onChange({
                          ...filters,
                          [key]: checked
                            ? [...filters[key], option.value]
                            : filters[key].filter(
                                (value) => value !== option.value,
                              ),
                        })
                      }
                    />
                    <Label
                      className="flex-1 cursor-pointer capitalize"
                      htmlFor={checkboxId}
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </fieldset>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
