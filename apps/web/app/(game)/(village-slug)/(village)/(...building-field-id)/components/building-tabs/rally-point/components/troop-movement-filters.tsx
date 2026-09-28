import { useTranslation } from 'react-i18next';
import { LuListFilter } from 'react-icons/lu';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { icons } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Badge } from 'app/components/ui/badge';
import { Button } from 'app/components/ui/button';
import { Checkbox } from 'app/components/ui/checkbox';
import { Label } from 'app/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';

export const troopMovementFilterTypes = [
  'deploymentOutgoing',
  'deploymentIncoming',
  'offensiveMovementOutgoing',
  'offensiveMovementIncoming',
  'adventure',
  'findNewVillage',
] as const;

export type TroopMovementFilterType = (typeof troopMovementFilterTypes)[number];

type TroopMovementFiltersProps = {
  troopMovementFilters: TroopMovementFilterType[];
  onChange: (filters: TroopMovementFilterType[]) => void;
};

export const TroopMovementFilters = ({
  troopMovementFilters,
  onChange,
}: TroopMovementFiltersProps) => {
  const { t } = useTranslation();
  const activeFilters = new Set(troopMovementFilters);

  const updateFilter = (
    filter: TroopMovementFilterType,
    isChecked: boolean,
  ) => {
    onChange(
      troopMovementFilterTypes.filter((value) =>
        value === filter ? isChecked : activeFilters.has(value),
      ),
    );
  };

  return (
    <SectionContent>
      <Text className="font-semibold">{t('Filter troop movements')}</Text>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            aria-label={t('Troop movement filters')}
            size="sm"
            variant="outline"
          >
            <LuListFilter className="size-4" />
            {t('Troop movement filters')}
            <Badge variant="secondary">{troopMovementFilters.length}</Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-80 p-3"
        >
          <div className="grid gap-1">
            {troopMovementFilterTypes.map((filter) => {
              const Icon = icons[filter];
              const id = `troop-movement-filter-${filter}`;

              return (
                <div
                  className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent"
                  key={filter}
                >
                  <Checkbox
                    id={id}
                    checked={activeFilters.has(filter)}
                    onCheckedChange={(checked) =>
                      updateFilter(filter, checked === true)
                    }
                  />
                  <Label
                    className="min-w-0 flex-1 cursor-pointer justify-between gap-3"
                    htmlFor={id}
                  >
                    <span className="truncate">{t(`ICONS.${filter}`)}</span>
                    <span className="text-muted-foreground grayscale">
                      <Icon className="size-4" />
                    </span>
                  </Label>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </SectionContent>
  );
};
