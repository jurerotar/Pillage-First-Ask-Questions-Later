import { Activity, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { ITooltip as ReactTooltipProps } from 'react-tooltip';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(village)/+types/page';
import { BuildingField } from 'app/(game)/(village-slug)/(village)/components/building-field';
import { BuildingFieldTooltip } from 'app/(game)/(village-slug)/components/building-field-tooltip';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import layoutStyles from 'app/(game)/(village-slug)/layout.module.scss';
import { Tooltip } from 'app/components/tooltip';
import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/village';

const resourceViewBuildingFieldIds: BuildingFieldType['id'][] = [
  ...Array(18),
].map((_, i) => i + 1);
const villageViewBuildingFieldIds: BuildingFieldType['id'][] = [
  ...Array(22),
].map((_, i) => i + 19);

const VillagePage = (props: Route.ComponentProps) => {
  const { params, matches } = props;

  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const isResourcesPageOpen = matches.some(
    (match) => match?.id === 'resources-page',
  );
  const isVillagePageOpen = matches.some(
    (match) => match?.id === 'village-page',
  );

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
          {resourceViewBuildingFieldIds.map((buildingFieldId) => (
            <Activity
              mode={isResourcesPageOpen ? 'visible' : 'hidden'}
              key={buildingFieldId}
            >
              <BuildingField buildingFieldId={buildingFieldId} />
            </Activity>
          ))}
          {villageViewBuildingFieldIds.map((buildingFieldId) => (
            <Activity
              mode={isVillagePageOpen ? 'visible' : 'hidden'}
              key={buildingFieldId}
            >
              <BuildingField buildingFieldId={buildingFieldId} />
            </Activity>
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
