import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { parseResourcesFromRFC } from '@pillage-first/utils/map';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(players)/(...player-slug)/+types/page';
import { usePlayer } from 'app/(game)/(village-slug)/(players)/(...player-slug)/hooks/use-player';
import { usePlayerVillages } from 'app/(game)/(village-slug)/(players)/(...player-slug)/hooks/use-player-villages';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
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

const PlayerPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug, playerSlug } = params;

  const { t } = useTranslation();
  const { player } = usePlayer(playerSlug);
  const { playerVillages } = usePlayerVillages(player.id);

  const title = `${t('{{playerName}}', { playerName: player.name })} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  const totalVillages = playerVillages.length;

  const totalPopulation = useMemo<number>(() => {
    let summedPopulation = 0;

    for (const { population } of playerVillages) {
      summedPopulation += population;
    }

    return summedPopulation;
  }, [playerVillages]);

  const sortedPlayerVillages = useMemo(() => {
    return playerVillages.toSorted((prevVillage, nextVillage) => {
      return nextVillage.population - prevVillage.population;
    });
  }, [playerVillages]);

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
      <Text as="h1">{player.name}</Text>

      <table className="w-80">
        <tbody>
          <tr>
            <th
              scope="row"
              className="p-1"
            >
              <Text className="text-left font-medium">{t('Tribe')}</Text>
            </th>
            <td className="p-1">
              <Text>{t(`TRIBES.${player.tribe.toUpperCase()}`)}</Text>
            </td>
          </tr>
          <tr>
            <th
              scope="row"
              className="p-1"
            >
              <Text className="text-left font-medium">{t('Faction')}</Text>
            </th>
            <td className="p-1">
              <Text>{t(`FACTIONS.${player.faction.toUpperCase()}`)}</Text>
            </td>
          </tr>
          <tr>
            <th
              scope="row"
              className="p-1"
            >
              <Text className="text-left font-medium">{t('Villages')}</Text>
            </th>
            <td className="p-1">
              <Text>{totalVillages}</Text>
            </td>
          </tr>
          <tr>
            <th
              scope="row"
              className="p-1"
            >
              <Text className="text-left font-medium">
                {t('Total population')}
              </Text>
            </th>
            <td className="p-1">
              <Text>{totalPopulation}</Text>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex flex-col justify-center gap-2">
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
                  <Text>{t('Resources')}</Text>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayerVillages.map(
                ({
                  id,
                  name,
                  coordinates,
                  population,
                  resourceFieldComposition,
                }) => (
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
                      <Text>
                        <Resources
                          className="justify-center"
                          iconClassName="size-4"
                          resources={parseResourcesFromRFC(
                            resourceFieldComposition,
                          )}
                        />
                      </Text>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default PlayerPage;
