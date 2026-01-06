import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { usePlayerRankings } from 'app/(game)/(village-slug)/(statistics)/components/hooks/use-player-rankings';
import { Section } from 'app/(game)/(village-slug)/components/building-layout';
import { useMe } from 'app/(game)/(village-slug)/hooks/use-me';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { Text } from 'app/components/text';
import { Pagination } from 'app/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

// TODO: Consider whether this should be customizable through preferences
const RESULTS_PER_PAGE = 20;

export const PopulationRankings = () => {
  const { t } = useTranslation();
  const { player } = useMe();
  const { rankedPlayers } = usePlayerRankings();

  const currentPlayerIndex = rankedPlayers.findIndex(
    ({ id }) => id === player.id,
  );
  const startingPage =
    Math.max(0, Math.floor(currentPlayerIndex / RESULTS_PER_PAGE)) + 1;

  const pagination = usePagination(
    rankedPlayers,
    RESULTS_PER_PAGE,
    startingPage,
  );
  const { currentPageItems, page, resultsPerPage } = pagination;

  return (
    <Section>
      <Text as="h2">{t('Population rankings')}</Text>
      <Text>
        {t(
          'A paginated list of player sorted by total population of all their villages.',
        )}
      </Text>
      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell />
              <TableHeaderCell>
                <Text>{t('Player')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Tribe')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Faction')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Villages')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Population')}</Text>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPageItems.map(
              (
                {
                  id,
                  name,
                  slug,
                  tribe,
                  faction,
                  villageCount,
                  totalPopulation,
                },
                index,
              ) => (
                <TableRow
                  key={id}
                  className={clsx(id === player.id && 'bg-gray-300/50')}
                >
                  <TableCell>
                    <Text className="text-sm font-medium">
                      {(page - 1) * resultsPerPage + index + 1}.
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Link to={`../players/${slug}`}>
                      <Text variant="link">{name}</Text>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Text>{t(`TRIBES.${tribe.toUpperCase()}`)}</Text>
                  </TableCell>
                  <TableCell>
                    <Text>{t(`FACTIONS.${faction.toUpperCase()}`)}</Text>
                  </TableCell>
                  <TableCell>
                    <Text>{villageCount}</Text>
                  </TableCell>
                  <TableCell>
                    <Text>{totalPopulation}</Text>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex w-full justify-end">
        <Pagination {...pagination} />
      </div>
    </Section>
  );
};
