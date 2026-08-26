import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { parseResourcesFromRFC } from '@pillage-first/utils/map';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(players)/(...player-slug)/+types/page';
import { usePlayer } from 'app/(game)/(village-slug)/(players)/(...player-slug)/hooks/use-player';
import { usePlayerVillages } from 'app/(game)/(village-slug)/(players)/(...player-slug)/hooks/use-player-villages';
import { OverflowContainer } from 'app/(game)/(village-slug)/components/building-layout';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
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

  const totalOccupiedOasis = useMemo<number>(() => {
    let summedOasis = 0;

    for (const { occupiedOasis } of playerVillages) {
      summedOasis += occupiedOasis.length;
    }

    return summedOasis;
  }, [playerVillages]);

  const totalPopulation = useMemo<number>(() => {
    let summedPopulation = 0;

    for (const { population } of playerVillages) {
      summedPopulation += population;
    }

    return summedPopulation;
  }, [playerVillages]);

  return (
    <PageContents>
      <title>{title}</title>
      <InformationPopover
        ariaLabel={t('{{playerName}}', { playerName: player.name })}
        className="top-2 right-2"
      >
        <Text>
          {t(
            "Review the player's tribe, faction, population, village count and village list.",
          )}
        </Text>
      </InformationPopover>
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
                {t('Occupied oasis')}
              </Text>
            </th>
            <td className="p-1">
              <Text>{totalOccupiedOasis}</Text>
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
        <Text as="h2">{t('Villages')}</Text>
        <OverflowContainer>
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
                <TableHeaderCell>
                  <Text>{t('Occupied oasis')}</Text>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerVillages.map(
                ({
                  id,
                  name,
                  coordinates,
                  occupiedOasis,
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
                        <span className="inline-flex gap-2">
                          <Resources
                            className="justify-center"
                            iconClassName="size-4"
                            resources={parseResourcesFromRFC(
                              resourceFieldComposition,
                            )}
                          />
                        </span>
                      </Text>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {occupiedOasis.map((oasis, index) => (
                          <Text
                            className="inline-flex items-center gap-2 whitespace-nowrap"
                            key={oasis.id}
                          >
                            {index > 0 && <span>,</span>}
                            {oasis.bonuses.map(({ resource, bonus }) => (
                              <span
                                className="inline-flex items-center gap-1"
                                key={resource}
                              >
                                <Icon
                                  type={resource}
                                  className="flex size-5"
                                />
                                {bonus}%
                              </span>
                            ))}
                          </Text>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </OverflowContainer>
      </div>
    </PageContents>
  );
};

export default PlayerPage;
