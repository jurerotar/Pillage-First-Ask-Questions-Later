import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { factionSchema } from '@pillage-first/types/models/faction';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { formatNumber, formatPercentage } from '@pillage-first/utils/format';
import { useGameWorldOverview } from 'app/(game)/(village-slug)/(statistics)/components/hooks/use-game-world-overview';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const overviewTribes = tribeSchema.exclude(['nature', 'spartans']).options;

const formatStatisticValue = (value: number, total: number) => {
  const percentage = total === 0 ? 0 : value / total;

  return `${formatNumber(value)} (${formatPercentage(percentage, false)})`;
};

export const GameWorldOverview = () => {
  const { t } = useTranslation();
  const { server } = useServer();
  const { gameWorldOverviewStatistics } = useGameWorldOverview();

  const serverStartDate = useMemo(() => {
    return new Date(server.createdAt).toLocaleDateString();
  }, [server.createdAt]);

  return (
    <Section>
      <InformationPopover ariaLabel={t('Server overview')}>
        <Text>{t('General statistics for this game world.')}</Text>
      </InformationPopover>
      <Text as="h2">{t('Server overview')}</Text>

      <SectionContent>
        <Table className="border-0">
          <TableBody>
            <TableRow>
              <TableHeaderCell className="border-r-0 text-left">
                <Text>{t('Name')}</Text>
              </TableHeaderCell>
              <TableCell className="text-left">
                <Text>{server.name}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell className="border-r-0 text-left">
                <Text>{t('Seed')}</Text>
              </TableHeaderCell>
              <TableCell className="text-left">
                <Text>{server.seed}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell className="border-r-0 text-left">
                <Text>{t('Start date')}</Text>
              </TableHeaderCell>
              <TableCell className="text-left">
                <Text>{serverStartDate}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell className="border-r-0 text-left">
                <Text>{t('Speed')}</Text>
              </TableHeaderCell>
              <TableCell className="text-left">
                <Text>{server.configuration.speed}x</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell className="border-r-0 text-left">
                <Text>{t('Map size')}</Text>
              </TableHeaderCell>
              <TableCell className="text-left">
                <Text>
                  {server.configuration.mapSize} x{' '}
                  {server.configuration.mapSize}
                </Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionContent>

      <SectionContent>
        <Text as="h3">{t('Faction')}</Text>
        <OverflowContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>
                  <Text>{t('Faction')}</Text>
                </TableHeaderCell>
                <TableHeaderCell>
                  <Text>{t('Players')}</Text>
                </TableHeaderCell>
                <TableHeaderCell>
                  <Text>{t('Villages')}</Text>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factionSchema.options.map((faction) => (
                <TableRow key={faction}>
                  <TableHeaderCell>
                    <Text>{t(`FACTIONS.${faction.toUpperCase()}`)}</Text>
                  </TableHeaderCell>
                  <TableCell>
                    <Text>
                      {formatStatisticValue(
                        gameWorldOverviewStatistics.playersByFaction[faction],
                        gameWorldOverviewStatistics.playerCount,
                      )}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text>
                      {formatStatisticValue(
                        gameWorldOverviewStatistics.villagesByFaction[faction],
                        gameWorldOverviewStatistics.villageCount,
                      )}
                    </Text>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium">
                <TableHeaderCell>
                  <Text>{t('Total')}</Text>
                </TableHeaderCell>
                <TableCell>
                  <Text>
                    {formatNumber(gameWorldOverviewStatistics.playerCount)}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text>
                    {formatNumber(gameWorldOverviewStatistics.villageCount)}
                  </Text>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </OverflowContainer>

        <Text as="h3">{t('Tribe')}</Text>
        <OverflowContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>
                  <Text>{t('Tribe')}</Text>
                </TableHeaderCell>
                <TableHeaderCell>
                  <Text>{t('Players')}</Text>
                </TableHeaderCell>
                <TableHeaderCell>
                  <Text>{t('Villages')}</Text>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overviewTribes.map((tribe) => (
                <TableRow key={tribe}>
                  <TableHeaderCell>
                    <Text>{t(`TRIBES.${tribe.toUpperCase()}`)}</Text>
                  </TableHeaderCell>
                  <TableCell>
                    <Text>
                      {formatStatisticValue(
                        gameWorldOverviewStatistics.playersByTribe[tribe],
                        gameWorldOverviewStatistics.playerCount,
                      )}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text>
                      {formatStatisticValue(
                        gameWorldOverviewStatistics.villagesByTribe[tribe],
                        gameWorldOverviewStatistics.villageCount,
                      )}
                    </Text>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium">
                <TableHeaderCell>
                  <Text>{t('Total')}</Text>
                </TableHeaderCell>
                <TableCell>
                  <Text>
                    {formatNumber(gameWorldOverviewStatistics.playerCount)}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text>
                    {formatNumber(gameWorldOverviewStatistics.villageCount)}
                  </Text>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </OverflowContainer>
      </SectionContent>
    </Section>
  );
};
