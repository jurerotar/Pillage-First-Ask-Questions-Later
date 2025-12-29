import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(players)/(...player-slug)/+types/page';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { usePlayerData } from '../hooks/use-player-data';
import { usePlayerVillages } from '../hooks/use-player-villages';

const PlayerContent = ({
  serverSlug,
  villageSlug,
  playerSlug,
}: {
  serverSlug: string;
  villageSlug: string;
  playerSlug: string;
}) => {
  const { playerInfo } = usePlayerData(serverSlug, villageSlug, playerSlug);
  const { playerVillages } = usePlayerVillages(playerInfo.id);
  const { t } = useTranslation();

  return (
    <>
      <div className="w-80">
        <div className="grid grid-cols-2 grid-rows-1 justify-between>">
          <div className="p-1">Tribe</div>
          <div className="p-1">{playerInfo.tribe}</div>
        </div>
        <div className="grid grid-cols-2 grid-rows-1 justify-between>">
          <div className="p-1">Faction</div>
          <div className="p-1">{playerInfo.faction ?? t('None')}</div>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-2">
        <div className="text-center font-semibold">{t('Villages')}</div>
        <div className="overflow-x-scroll scrollbar-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>
                  <Text>{t('Village')}</Text>
                </TableHeaderCell>
                <TableHeaderCell>
                  <Text>{t('Population')}</Text>
                </TableHeaderCell>
                <TableHeaderCell>
                  <Text>{t('Coordinates')}</Text>
                </TableHeaderCell>
                <TableHeaderCell>
                  <Text>{t('Resource Composition')}</Text>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerVillages.map(
                ({
                  id,
                  name,
                  coordinates,
                  population,
                  resourceFieldComposition,
                }) => {
                  return (
                    <TableRow key={id}>
                      <TableCell>
                        <Text variant="link">
                          <Link
                            to={`../map?x=${coordinates.x}&y=${coordinates.y}`}
                          >
                            {name}
                          </Link>
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text>{population}</Text>
                      </TableCell>
                      <TableCell>
                        <Text variant="link">
                          <Link
                            to={`../map?x=${coordinates.x}&y=${coordinates.y}`}
                          >
                            {coordinates.x}, {coordinates.y}
                          </Link>
                        </Text>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {resourceFieldComposition
                            .split('')
                            .map((digit, index) => {
                              const resourceTypes: Array<
                                'wood' | 'clay' | 'iron' | 'wheat'
                              > = ['wood', 'clay', 'iron', 'wheat'];
                              const resourceType = resourceTypes[index];
                              return (
                                <div
                                  key={resourceType}
                                  className="flex gap-1 items-center"
                                >
                                  <Icon
                                    type={resourceType}
                                    className="size-4"
                                  />
                                  <span>{digit}</span>
                                </div>
                              );
                            })}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                },
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

const PlayerPage = ({ params }: Route.ComponentProps) => {
  const { playerSlug, serverSlug, villageSlug } = params;
  const { playerInfo } = usePlayerData(serverSlug, villageSlug, playerSlug);
  const { t } = useTranslation();

  const title = `${t('Player - {{playerSlug}}', { playerSlug })} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="../statistics">
              {t('Statistics')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {t('Player - {{playerSlug}}', { playerSlug })}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1"> {playerInfo.name}</Text>

      <Suspense fallback={<div>Loading player data...</div>}>
        <PlayerContent
          serverSlug={serverSlug}
          villageSlug={villageSlug}
          playerSlug={playerSlug}
        />
      </Suspense>
    </>
  );
};

export default PlayerPage;
