import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { TroopTrainingQueue } from 'app/(game)/(village-slug)/(overview)/components/troop-training-queue';
import { Section } from 'app/(game)/(village-slug)/components/building-layout';
import { AcademyResearchTable } from 'app/(game)/(village-slug)/components/academy-research-table';
import { SmithyImprovementTable } from 'app/(game)/(village-slug)/components/smithy-improvement-table';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import type React from 'react';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(overview)/+types/page';

const OverviewPage: React.FC<Route.ComponentProps> = ({ params }) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { resourcesPath } = useGameNavigation();
  const { currentVillage } = useCurrentVillage();
  const { tribe } = useTribe();

  const doesAcademyExist = currentVillage.buildingFields.some(
    ({ buildingId }) => buildingId === 'ACADEMY',
  );
  const doesSmithyExist = currentVillage.buildingFields.some(
    ({ buildingId }) => buildingId === 'SMITHY',
  );
  const doesMarketplaceExist = currentVillage.buildingFields.some(
    ({ buildingId }) => buildingId === 'MARKETPLACE',
  );
  const doesBreweryExist = currentVillage.buildingFields.some(
    ({ buildingId }) => buildingId === 'BREWERY',
  );

  const academyName = assetsT('BUILDINGS.ACADEMY.NAME');
  const smithyName = assetsT('BUILDINGS.SMITHY.NAME');
  const marketplaceName = assetsT('BUILDINGS.MARKETPLACE.NAME');
  const breweryName = assetsT('BUILDINGS.BREWERY.NAME');

  const title = `${t('Overview')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={resourcesPath}>{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Village overview')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Section>
        <Text as="h1">{t('Village overview')}</Text>
        <Text>
          {t(
            'Village overview allows you to track active troop training, smithy and academy queues, monitor merchant availability and movements and track ongoing celebrations.',
          )}
        </Text>
        <Section>
          <Text as="h2">{t('Troop training')}</Text>
          <TroopTrainingQueue buildingId="BARRACKS" />
          <TroopTrainingQueue buildingId="STABLE" />
          <TroopTrainingQueue buildingId="WORKSHOP" />
          <TroopTrainingQueue buildingId="GREAT_BARRACKS" />
          <TroopTrainingQueue buildingId="GREAT_STABLE" />
        </Section>
        <Section>
          <Text as="h2">{academyName}</Text>
          {!doesAcademyExist &&
            t(
              'You need to build the {{buildingName}} before you can start research.',
              { buildingName: academyName },
            )}
          {doesAcademyExist && <AcademyResearchTable />}
        </Section>
        <Section>
          <Text as="h2">{smithyName}</Text>
          {!doesSmithyExist &&
            t(
              'You need to build the {{buildingName}} before you can improve troops.',
              { buildingName: smithyName },
            )}
          {doesSmithyExist && <SmithyImprovementTable />}
        </Section>
        <Section>
          <Text as="h2">{marketplaceName}</Text>
          {!doesMarketplaceExist &&
            t(
              'You need to build the {{buildingName}} before you can dispatch merchants.',
              { buildingName: marketplaceName },
            )}
          <Alert variant="warning">
            {t('This section is still under development')}
          </Alert>
        </Section>
        {tribe === 'teutons' && (
          <Section>
            <Text as="h2">{breweryName}</Text>
            {!doesBreweryExist &&
              t(
                'You need to build the {{buildingName}} before you can organize celebrations.',
                { buildingName: breweryName },
              )}
            <Alert variant="warning">
              {t('This section is still under development')}
            </Alert>
          </Section>
        )}
      </Section>
    </>
  );
};

export default OverviewPage;
