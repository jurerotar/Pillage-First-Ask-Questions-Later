import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  calculateTotalPopulationForLevel,
  getBuildingFieldByBuildingFieldId,
} from '@pillage-first/game-assets/utils/buildings';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useDemolishBuildingErrorBag } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/hooks/use-demolish-building-error-bag';
import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { MainBuildingDemolitionTable } from 'app/(game)/(village-slug)/components/main-building-demolition-table';
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
  const { isOpen, openModal, closeModal } = useDialog();

  const [buildingFieldToDemolish, setBuildingFieldToDemolish] =
    useState<BuildingField>(demolishableBuildings[0]);

  const { downgradeBuilding, demolishBuilding } = useBuildingActions(
    buildingFieldToDemolish.buildingId,
    buildingFieldToDemolish.id,
  );
  const { getBuildingDowngradeErrorBag, getDemolishBuildingErrorBag } =
    useDemolishBuildingErrorBag(
      buildingFieldToDemolish.id,
      buildingFieldToDemolish.buildingId,
    );

  const [targetLevel, setTargetLevel] = useState<number>(() => {
    return Math.max(buildingFieldToDemolish.level - 1, 0);
  });

  useEffect(() => {
    setTargetLevel(Math.max(buildingFieldToDemolish.level - 1, 0));
  }, [buildingFieldToDemolish.level]);

  const buildingDowngradeErrorBag = getBuildingDowngradeErrorBag();
  const demolishBuildingErrorBag = getDemolishBuildingErrorBag();

  const buildingName = t(
    `BUILDINGS.${buildingFieldToDemolish.buildingId}.NAME`,
  );
  const isDemolishCompletely = targetLevel === 0;
  const currentLevelPopulation = calculateTotalPopulationForLevel(
    buildingFieldToDemolish.buildingId,
    buildingFieldToDemolish.level,
  );
  const targetLevelPopulation = calculateTotalPopulationForLevel(
    buildingFieldToDemolish.buildingId,
    targetLevel,
  );
  const populationLossOnDowngrade =
    currentLevelPopulation - targetLevelPopulation;
  const availableTargetLevels = Array.from(
    { length: buildingFieldToDemolish.level },
    (_, index) => buildingFieldToDemolish.level - 1 - index,
  );

  const confirmationTitle = isDemolishCompletely
    ? t('Demolish {{buildingName}}', { buildingName })
    : t('Downgrade {{buildingName}} to level {{level}}', {
        buildingName,
        level: targetLevel,
      });

  const confirmationConsequences = (() => {
    const consequences: string[] = [];

    if (isDemolishCompletely) {
      consequences.push(
        t('{{buildingName}} will be demolished completely.', {
          buildingName,
        }),
      );
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
            toLevel: targetLevel,
          },
        ),
      );

      if (buildingFieldToDemolish.level - targetLevel > 1) {
        consequences.push(
          t(
            'Your village will lose all the benefits of {{buildingName}} levels {{currentLevel}} - {{targetLevel}}.',
            {
              buildingName,
              currentLevel: buildingFieldToDemolish.level,
              targetLevel: targetLevel,
            },
          ),
        );
      } else {
        consequences.push(
          t(
            'Your village will lose all the benefits of {{buildingName}} level {{level}}.',
            {
              buildingName,
              level: buildingFieldToDemolish.level,
            },
          ),
        );
      }
    }

    consequences.push(
      t('Your population will decrease by {{populationLoss}}.', {
        populationLoss: populationLossOnDowngrade,
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

  const onConfirm = async () => {
    if (targetLevel === 0) {
      demolishBuilding();
    } else {
      downgradeBuilding(targetLevel);
    }

    if (preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled) {
      await navigate('..', { relative: 'path' });
    }

    closeModal();
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
        <div className="flex gap-2 flex-wrap">
          <Select
            disabled={!canDemolishBuildings}
            onValueChange={onValueChange}
            value={`${buildingFieldToDemolish.id}`}
          >
            <SelectGroup>
              <SelectLabel>{t('Select building')}</SelectLabel>
              <SelectTrigger>
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

          <Select
            disabled={!canDemolishBuildings}
            onValueChange={(value) =>
              setTargetLevel(Number.parseInt(value, 10))
            }
            value={`${targetLevel}`}
          >
            <SelectGroup>
              <SelectLabel>{t('Target level')}</SelectLabel>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTargetLevels.map((level) => (
                  <SelectItem
                    key={level}
                    value={`${level}`}
                  >
                    {level === 0
                      ? t('Demolish completely')
                      : t('level {{level}}', { level })}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectGroup>
          </Select>
        </div>
      </SectionContent>
      <SectionContent>
        <ErrorBag
          errorBag={[...buildingDowngradeErrorBag, ...demolishBuildingErrorBag]}
        />
        <div className="flex gap-2 flex-wrap">
          <Button
            size="fit"
            disabled={
              !canDemolishBuildings ||
              buildingDowngradeErrorBag.length > 0 ||
              demolishBuildingErrorBag.length > 0
            }
            onClick={() => openModal('DOWNGRADE')}
          >
            {isDemolishCompletely
              ? t('Demolish completely')
              : t('Downgrade to level {{level}}', {
                  level: targetLevel,
                })}
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
