import { useTranslation } from 'react-i18next';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { icons } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';

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

  return (
    <SectionContent>
      <Text className="font-semibold">{t('Filter troop movements')}</Text>
      <ToggleGroup
        type="multiple"
        value={troopMovementFilters}
        onValueChange={onChange}
        variant="outline"
        size="sm"
      >
        {troopMovementFilterTypes.map((filter) => {
          const Icon = icons[filter];
          return (
            <ToggleGroupItem
              key={filter}
              data-tooltip-id="general-tooltip"
              data-tooltip-content={t(`ICONS.${filter}`)}
              value={filter}
              className="grayscale"
            >
              <Icon className="size-4" />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </SectionContent>
  );
};
