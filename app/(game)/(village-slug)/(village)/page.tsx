import { BuildingField } from 'app/(game)/(village-slug)/(village)/components/building-field';
import { BuildingFieldTooltip } from 'app/(game)/(village-slug)/components/building-field-tooltip';
import { Tooltip } from 'app/components/tooltip';
import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/building-field';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type React from 'react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import layoutStyles from 'app/(game)/(village-slug)/layout.module.scss';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(village)/+types/page';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import type { ITooltip as ReactTooltipProps } from 'react-tooltip';

const resourceViewBuildingFieldIds = [...Array(18)].map(
  (_, i) => i + 1,
) as BuildingFieldType['id'][];
const villageViewBuildingFieldIds = [...Array(22)].map(
  (_, i) => i + 19,
) as BuildingFieldType['id'][];

const VillagePage: React.FC<Route.ComponentProps> = ({ params, matches }) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const isResourcesPageOpen = matches.some(
    (match) => match?.id === 'resources-page',
  );
  const isVillagePageOpen = matches.some(
    (match) => match?.id === 'village-page',
  );

  const buildingFieldIdsToDisplay = isResourcesPageOpen
    ? resourceViewBuildingFieldIds
    : villageViewBuildingFieldIds;

  const renderTooltip = useCallback(
    ({
      activeAnchor,
    }: Parameters<NonNullable<ReactTooltipProps['render']>>[0]) => {
      const id = activeAnchor?.getAttribute('data-building-field-id');
      if (!id) {
        return null;
      }

      return (
        <BuildingFieldTooltip
          buildingFieldId={Number(id) as BuildingFieldType['id']}
        />
      );
    },
    [],
  );

  useEffect(() => {
    const className = layoutStyles['background-image--village'];
    document.body.classList.toggle(className, isVillagePageOpen);

    return () => {
      document.body.classList.remove(className);
    };
  }, [isVillagePageOpen]);

  const title = `${isResourcesPageOpen ? t('Resources') : t('Village')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Tooltip
        anchorSelect="[data-building-field-id]"
        closeEvents={{
          mouseleave: true,
        }}
        hidden={!isWiderThanLg}
        render={renderTooltip}
      />
      <main className="flex flex-col items-center justify-center mx-auto lg:mt-20 lg:mb-0 max-h-[calc(100dvh-12rem)] standalone:max-h-[calc(100dvh-15rem)] h-screen lg:h-auto lg:max-h-none overflow-x-hidden">
        <div className="relative aspect-[16/10] scrollbar-hidden min-w-[460px] max-w-5xl w-full">
          {buildingFieldIdsToDisplay.map((buildingFieldId) => (
            <BuildingField
              key={buildingFieldId}
              buildingFieldId={buildingFieldId}
            />
          ))}
          {isResourcesPageOpen && (
            <Link
              to="../village"
              className="absolute text-xs lg:size-24 lg:text-sm left-1/2 top-1/2 size-14 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-500"
              aria-label={t('Village')}
            >
              Village
            </Link>
          )}
        </div>
      </main>
    </>
  );
};

export default VillagePage;
