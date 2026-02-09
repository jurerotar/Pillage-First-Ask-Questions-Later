import { clsx } from 'clsx';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useVillageRankings } from 'app/(game)/(village-slug)/(statistics)/components/hooks/use-village-rankings';
import { Section } from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
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

export const VillageRankings = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { rankedVillages } = useVillageRankings();

  const startingPage = useMemo(() => {
    const currentVillageIndex = rankedVillages.findIndex(
      ({ id }) => id === currentVillage.id,
    );

    return Math.max(0, Math.floor(currentVillageIndex / RESULTS_PER_PAGE)) + 1;
  }, [rankedVillages, currentVillage.id]);

  const pagination = usePagination(
    rankedVillages,
    RESULTS_PER_PAGE,
    startingPage,
  );
  const { currentPageItems, page, resultsPerPage } = pagination;

  return (
    <Section>
      <Text as="h2">{t('Village rankings')}</Text>
      <Text>{t('A paginated list of villages sorted by population.')}</Text>
      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell />
              <TableHeaderCell>
                <Text>{t('Player')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Village')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Population')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Coordinates')}</Text>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPageItems.map(
              (
                { id, name, coordinates, playerName, population, playerSlug },
                index,
              ) => {
                const villageUrl = `../map?x=${coordinates.x}&y=${coordinates.y}`;

                return (
                  <TableRow
                    key={id}
                    className={clsx(
                      id === currentVillage.id && 'bg-gray-300/50',
                    )}
                  >
                    <TableCell>
                      <Text className="text-sm font-medium">
                        {(page - 1) * resultsPerPage + index + 1}.
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text variant="link">
                        <Link to={`../players/${playerSlug}`}>
                          {playerName}
                        </Link>
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text
                        className="text-center"
                        variant="link"
                      >
                        <Link to={villageUrl}>{name}</Link>
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text>{population}</Text>
                    </TableCell>
                    <TableCell>
                      <Text
                        className="text-center"
                        variant="link"
                      >
                        <Link to={villageUrl}>
                          {coordinates.x}, {coordinates.y}
                        </Link>
                      </Text>
                    </TableCell>
                  </TableRow>
                );
              },
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
