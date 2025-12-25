import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useDemolishBuildingErrorBag } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/hooks/use-demolish-building-error-bag';
import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { getBuildingFieldByBuildingFieldId } from 'app/assets/utils/buildings';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import type { BuildingField } from 'app/interfaces/models/game/village';

export const DemolishBuilding = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { preferences } = usePreferences();

  const canDemolishBuildings =
    (currentVillage.buildingFields.find(
      ({ buildingId }) => buildingId === 'MAIN_BUILDING',
    )?.level ?? 0) >= 10;

  const demolishableBuildings = currentVillage.buildingFields.filter(
    ({ level }) => level > 0,
  );

  const [buildingFieldToDemolish, setBuildingFieldToDemolish] =
    useState<BuildingField>(demolishableBuildings[0]);

  const { demolishBuilding, downgradeBuilding } = useBuildingActions(
    buildingFieldToDemolish.buildingId,
    buildingFieldToDemolish.id,
  );
  const { getBuildingDowngradeErrorBag } = useDemolishBuildingErrorBag(
    buildingFieldToDemolish.id,
  );
  const buildingDowngradeErrorBag = getBuildingDowngradeErrorBag();

  const onValueChange = (value: string) => {
    const buildingField = getBuildingFieldByBuildingFieldId(
      currentVillage,
      Number.parseInt(value, 10) as BuildingField['id'],
    )!;
    setBuildingFieldToDemolish(buildingField);
  };

  const onDowngrade = async () => {
    if (preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled) {
      downgradeBuilding();
    }

    await navigate('..', { relative: 'path' });
  };

  const onDemolish = async () => {
    demolishBuilding();
    await navigate('..', { relative: 'path' });
  };

  return (
    <section className="flex flex-col gap-2">
      <Text as="h2">{t('Demolish buildings')}</Text>
      <Text>
        {t(
          'With a level 10 {{mainBuilding}} you are able to downgrade or demolish a building. You cannot downgrade or demolish buildings which are currently being upgraded.',
          {
            mainBuilding: t('BUILDINGS.MAIN_BUILDING.NAME'),
          },
        )}
      </Text>

      <Select
        disabled={!canDemolishBuildings}
        onValueChange={onValueChange}
        value={`${buildingFieldToDemolish.id}`}
      >
        <SelectGroup>
          <SelectLabel>{t('Select building')}</SelectLabel>
          <SelectTrigger className="w-full lg:w-1/2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {demolishableBuildings.map((buildingField) => (
              <SelectItem
                key={buildingField.id}
                value={`${buildingField.id}`}
              >
                {t(`BUILDINGS.${buildingField.buildingId}.NAME`)} -{' '}
                {t('level {{level}}', { level: buildingField.level })}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectGroup>
      </Select>

      <div className="flex gap-2 flex-wrap">
        {buildingFieldToDemolish.level > 1 && (
          <Button
            size="fit"
            disabled={
              !canDemolishBuildings || buildingDowngradeErrorBag.length > 0
            }
            onClick={onDowngrade}
          >
            {t('Downgrade to level {{level}}', {
              level: buildingFieldToDemolish.level - 1,
            })}
          </Button>
        )}
        <Button
          size="fit"
          disabled={
            !canDemolishBuildings || buildingDowngradeErrorBag.length > 0
          }
          onClick={onDemolish}
        >
          {t('Demolish completely')}
        </Button>
      </div>
    </section>
  );
};
