import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  calculateTotalPopulationForLevel,
  getBuildingFieldByBuildingFieldId,
} from '@pillage-first/game-assets/utils/buildings';
import {
  type BuildingField,
  specialFieldIds,
} from '@pillage-first/types/models/building-field';
import { useDemolishBuildingErrorBag } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/hooks/use-demolish-building-error-bag';
import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { useDialog } from 'app/hooks/use-dialog';
import { MainBuildingDemolitionTable } from '../../../../../../components/main-building-demolition-table.tsx';

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
  const {
    isOpen,
    openModal,
    closeModal,
    modalArgs: pendingAction,
  } = useDialog<'DOWNGRADE' | 'DEMOLISH'>();

  const [buildingFieldToDemolish, setBuildingFieldToDemolish] =
    useState<BuildingField>(demolishableBuildings[0]);

  const { demolishBuilding, downgradeBuilding } = useBuildingActions(
    buildingFieldToDemolish.buildingId,
    buildingFieldToDemolish.id,
  );
  const { getBuildingDowngradeErrorBag, getDemolishBuildingErrorBag } =
    useDemolishBuildingErrorBag(
      buildingFieldToDemolish.id,
      buildingFieldToDemolish.buildingId,
    );
  const buildingDowngradeErrorBag = getBuildingDowngradeErrorBag();
  const demolishBuildingErrorBag = getDemolishBuildingErrorBag();
  const buildingName = t(
    `BUILDINGS.${buildingFieldToDemolish.buildingId}.NAME`,
  );
  const downgradedLevel = buildingFieldToDemolish.level - 1;
  const currentLevelPopulation = calculateTotalPopulationForLevel(
    buildingFieldToDemolish.buildingId,
    buildingFieldToDemolish.level,
  );
  const downgradedLevelPopulation = calculateTotalPopulationForLevel(
    buildingFieldToDemolish.buildingId,
    downgradedLevel,
  );
  const populationLossOnDowngrade =
    currentLevelPopulation - downgradedLevelPopulation;

  const confirmationTitle =
    pendingAction.current === 'DOWNGRADE'
      ? t('Downgrade {{buildingName}} to level {{level}}', {
          buildingName,
          level: downgradedLevel,
        })
      : t('Demolish {{buildingName}}', { buildingName });

  const confirmationConsequences = (() => {
    const consequences: string[] = [];

    if (pendingAction.current === 'DEMOLISH') {
      if (specialFieldIds.includes(buildingFieldToDemolish.id)) {
        consequences.push(
          t(
            '{{buildingName}} will be demolished completely, but the building field will remain occupied.',
            {
              buildingName,
            },
          ),
        );
      } else {
        consequences.push(
          t(
            '{{buildingName}} will be demolished completely and the building field will be cleared.',
            {
              buildingName,
            },
          ),
        );
      }

      consequences.push(
        t('Your village will lose all the benefits of {{buildingName}}.', {
          buildingName,
        }),
      );
    } else {
      consequences.push(
        t(
          '{{buildingName}} will be downgraded from level {{fromLevel}} to level {{toLevel}}.',
          {
            buildingName,
            fromLevel: buildingFieldToDemolish.level,
            toLevel: downgradedLevel,
          },
        ),
        t(
          'Your village will lose all the benefits of {{buildingName}} level {{level}}.',
          {
            buildingName,
            level: buildingFieldToDemolish.level,
          },
        ),
      );
    }

    consequences.push(
      t('Your population will decrease by {{populationLoss}}.', {
        populationLoss:
          pendingAction.current === 'DEMOLISH'
            ? currentLevelPopulation
            : populationLossOnDowngrade,
      }),
    );

    return consequences;
  })();

  const onValueChange = (value: string) => {
    const buildingField = getBuildingFieldByBuildingFieldId(
      currentVillage,
      Number.parseInt(value, 10),
    )!;
    setBuildingFieldToDemolish(buildingField);
  };

  const onDowngrade = async () => {
    downgradeBuilding();

    if (preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled) {
      await navigate('..', { relative: 'path' });
    }
  };

  const onDemolish = async () => {
    demolishBuilding();

    if (preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled) {
      await navigate('..', { relative: 'path' });
    }
  };

  const onConfirm = async () => {
    if (pendingAction.current === 'DOWNGRADE') {
      await onDowngrade();
      closeModal();
      return;
    }

    if (pendingAction.current === 'DEMOLISH') {
      await onDemolish();
      closeModal();
    }
  };

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Demolish buildings')}</Text>
        <Text>
          {t(
            'With a level 10 {{mainBuilding}} you are able to downgrade or demolish a building. You cannot downgrade or demolish buildings which are currently being upgraded.',
            {
              mainBuilding: t('BUILDINGS.MAIN_BUILDING.NAME'),
            },
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <MainBuildingDemolitionTable />
      </SectionContent>
      <SectionContent>
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
      </SectionContent>
      <SectionContent>
        <ErrorBag
          errorBag={[...buildingDowngradeErrorBag, ...demolishBuildingErrorBag]}
        />

        <div className="flex gap-2 flex-wrap">
          {buildingFieldToDemolish.level > 1 && (
            <Button
              size="fit"
              disabled={
                !canDemolishBuildings ||
                buildingDowngradeErrorBag.length > 0 ||
                demolishBuildingErrorBag.length > 0
              }
              onClick={() => openModal('DOWNGRADE')}
            >
              {t('Downgrade to level {{level}}', {
                level: buildingFieldToDemolish.level - 1,
              })}
            </Button>
          )}
          <Button
            size="fit"
            disabled={
              !canDemolishBuildings ||
              buildingDowngradeErrorBag.length > 0 ||
              demolishBuildingErrorBag.length > 0
            }
            onClick={() => openModal('DEMOLISH')}
          >
            {t('Demolish completely')}
          </Button>
        </div>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => !open && closeModal()}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmationTitle}</DialogTitle>
            </DialogHeader>

            <DialogDescription>
              {t(
                'This action is permanent and cannot be reversed except by re-constructing and re-upgrading the building.',
              )}
            </DialogDescription>

            <ErrorBag errorBag={confirmationConsequences} />

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeModal}
              >
                {t('Cancel')}
              </Button>
              <Button onClick={onConfirm}>{t('Confirm')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SectionContent>
    </Section>
  );
};
