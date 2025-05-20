import { Text } from 'app/components/text';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from 'app/components/ui/button';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';
import { Alert } from 'app/components/ui/alert';
import { getBuildingData, resourceBuildingIds } from 'app/(game)/(village-slug)/utils/building';
import { isCapitalBuildingRequirement } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/guards/building-requirements';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

const changeIsCapitalProperty = (queryClient: QueryClient, currentVillage: PlayerVillage, isCapital: boolean): void => {
  queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], (playerVillages) => {
    return playerVillages!.map((village) => {
      if (village.id === currentVillage.id) {
        return {
          ...village,
          isCapital,
        };
      }

      return village;
    });
  });
};

export const Capital = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const queryClient = useQueryClient();
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillages();

  const capitalVillage = playerVillages.find(({ isCapital }) => isCapital);
  const hasCapitalVillage = !!capitalVillage;

  const buildingsToDelevelOnCapitalDemotion = !currentVillage.isCapital
    ? []
    : currentVillage.buildingFields.filter(({ buildingId, level }) => {
        const { buildingRequirements } = getBuildingData(buildingId);

        // Resource fields above level 10 get deleveled
        if (resourceBuildingIds.includes(buildingId) && level > 10) {
          return true;
        }

        // Buildings only allowed in capital will be demolished
        const capitalRequirement = buildingRequirements.find(isCapitalBuildingRequirement);
        return capitalRequirement?.canBuildOnlyInCapital;
      });

  const buildingsToDelevelOnCapitalPromotion = !currentVillage.isCapital
    ? []
    : currentVillage.buildingFields.filter(({ buildingId }) => {
        const { buildingRequirements } = getBuildingData(buildingId);

        // Buildings only allowed outside of capital will be demolished
        const capitalRequirement = buildingRequirements.find(isCapitalBuildingRequirement);
        return capitalRequirement?.canBuildOnlyOutsideOfCapital;
      });

  const demoteCapital = () => {
    changeIsCapitalProperty(queryClient, currentVillage, false);
  };

  const promoteToCapital = () => {
    changeIsCapitalProperty(queryClient, currentVillage, true);
  };

  return (
    <section className="flex flex-col gap-2">
      <Text as="h2">{t('Capital')}</Text>
      <Text>
        <Trans>
          You can promote any village to become your <strong>capital</strong> by toggling the "Promote to capital" option. Only one village
          may be promoted as a capital at one time.
        </Trans>
      </Text>
      <Text as="h4">
        <Trans>
          Promoting a village to your capital grants the following <strong>benefits</strong>:
        </Trans>
      </Text>
      <ul className="list-disc pl-4.5">
        <li>
          <Text>{t('Allows resource fields to be upgraded beyond level 10')}</Text>
        </li>
        <li>
          <Text>{t('Grants immunity to conquest by chiefs')}</Text>
        </li>
      </ul>
      <Text as="h4">
        <Trans>
          However, capital villages come with <strong>trade-offs</strong>:
        </Trans>
      </Text>
      <ul className="list-disc pl-4.5">
        <li>
          <Text>{t('Special buildings like Great Barracks and Great Stables cannot be built in the capital')}</Text>
        </li>
        <li>
          <Text>{t('You can only have one capital at a time')}</Text>
        </li>
      </ul>
      <Text as="h4">
        <Trans>
          If you choose to <strong>demote</strong> your current capital:
        </Trans>
      </Text>
      <ul className="list-disc pl-4.5">
        <li>
          <Text>{t('All resource fields above level 10 will be reduced back to level 10')}</Text>
        </li>
        <li>
          <Text>{t('The Palace will be destroyed')}</Text>
        </li>
        <li>
          <Text>{t('You can then promote another village as the new capital')}</Text>
        </li>
      </ul>
      {hasCapitalVillage && (
        <>
          {currentVillage.isCapital && (
            <>
              <Text>{t('This village is your current capital.')}</Text>
              {/* Only show alert if there are buildings that are going to get demolished/de-leveled */}
              {buildingsToDelevelOnCapitalDemotion.length > 0 && (
                <Alert variant="error">
                  <Text>{t('Demoting your capital will demolish or de-level the following buildings:')}</Text>
                  <ul className="list-disc pl-4.5">
                    {buildingsToDelevelOnCapitalDemotion.map(({ buildingId, id, level }) => (
                      <li key={id}>
                        {assetsT(`BUILDINGS.${buildingId}.NAME`)} - {t('level {{level}}', { level })}
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}
              <Button onClick={demoteCapital}>{t('Demote capital')}</Button>
            </>
          )}
          {!currentVillage.isCapital && (
            <Text>
              {t(
                'This village cannot be promoted to capital. Village "{{villageName}}" is your capital. Demote your current capital first.',
                { villageName: capitalVillage.name },
              )}
            </Text>
          )}
        </>
      )}
      {!hasCapitalVillage && (
        <>
          <Alert variant="success">
            <Text>{t('This village can be promoted to capital.')}</Text>
          </Alert>
          {buildingsToDelevelOnCapitalPromotion.length > 0 && (
            <Alert variant="error">
              <Text>{t('Promoting this village to your capital will demolish the following buildings:')}</Text>
              <ul className="list-disc pl-4.5">
                {buildingsToDelevelOnCapitalPromotion.map(({ buildingId, id, level }) => (
                  <li key={id}>
                    {assetsT(`BUILDINGS.${buildingId}.NAME`)} - {t('level {{level}}', { level })}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          <Button onClick={promoteToCapital}>{t('Promote to capital')}</Button>
        </>
      )}
    </section>
  );
};
