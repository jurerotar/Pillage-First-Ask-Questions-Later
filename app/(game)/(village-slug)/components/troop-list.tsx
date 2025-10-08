import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { useTranslation } from 'react-i18next';
import { GiRallyTheTroops } from 'react-icons/gi';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/utils/icon';
import { formatNumber, partition } from 'app/utils/common';
import { Tooltip } from 'react-tooltip';
import type { Troop } from 'app/interfaces/models/game/troop';
import { Text } from 'app/components/text';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { Suspense, useId } from 'react';

const TroopListContent = () => {
  const { t } = useTranslation();
  const { shouldShowSidebars } = useGameLayoutState();
  const { currentVillage } = useCurrentVillage();
  const { villageTroops } = useVillageTroops();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const tooltipId = useId();
  const tooltipKey = isWiderThanLg ? 'wider-than-lg' : 'not-wider-than-lg';

  if (!shouldShowSidebars) {
    return null;
  }

  const currentVillagePlayerTroops = villageTroops.filter(
    ({ tileId }) => tileId === currentVillage.tileId,
  );

  const [ownTroops, reinforcements] = partition<Troop>(
    currentVillagePlayerTroops,
    ({ tileId, source }) => tileId === source,
  );

  return (
    <aside className="fixed right-0 bottom-26 lg:bottom-14 flex lg:flex-col gap-1 bg-background/80 p-1 shadow-xs border-border rounded-r-none rounded-xs">
      <div
        data-tooltip-id={tooltipId}
        className="flex flex-col relative cursor-pointer"
      >
        <GiRallyTheTroops className="text-2xl lg:text-3xl text-gray-400 bg-background p-2 box-content border border-border rounded-xs" />
      </div>

      <Tooltip
        key={tooltipKey}
        id={tooltipId}
        className="!z-20 !rounded-xs !px-2 !py-1 !bg-background !text-black border border-border"
        classNameArrow="border-r border-b border-border"
        place="top-start"
        {...(isWiderThanLg && {
          isOpen: true,
        })}
      >
        <div className="flex flex-col gap-2 max-h-96 lg:max-h-125 overflow-y-scroll scrollbar-hidden">
          <div className="flex flex-col gap-1">
            <Text as="h3">{t('Own troops')}</Text>
            {ownTroops.length === 0 && (
              <Text>{t('There are currently no troops in this village')}</Text>
            )}
            <ul className="flex flex-col items-end gap-2">
              {ownTroops.map((troop) => (
                <li
                  className="flex items-center gap-1 w-full text-right"
                  key={troop.unitId}
                >
                  <Icon
                    type={unitIdToUnitIconMapper(troop.unitId)}
                    className="text-base size-4 lg:size-6"
                  />

                  <Text>
                    {formatNumber(troop.amount)}{' '}
                    {t(`UNITS.${troop.unitId}.NAME`, {
                      count: troop.amount,
                    })}
                  </Text>
                </li>
              ))}
            </ul>
          </div>
          {reinforcements.length > 0 && (
            <div className="flex flex-col gap-1">
              <Text as="h3">{t('Reinforcements')}</Text>
              <ul className="flex flex-col items-end gap-2">
                {reinforcements.map((troop) => (
                  <li
                    className="flex items-center gap-1 w-full text-right"
                    key={troop.unitId}
                  >
                    <Icon
                      type={unitIdToUnitIconMapper(troop.unitId)}
                      className="text-base size-4 lg:size-6"
                    />

                    <Text>
                      {formatNumber(troop.amount)}{' '}
                      {t(`UNITS.${troop.unitId}.NAME`, {
                        count: troop.amount,
                      })}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Tooltip>
    </aside>
  );
};

export const TroopList = () => {
  return (
    <Suspense fallback={null}>
      <TroopListContent />
    </Suspense>
  );
};
