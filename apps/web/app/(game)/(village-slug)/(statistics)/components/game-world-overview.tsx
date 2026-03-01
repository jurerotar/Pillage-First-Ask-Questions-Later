import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FACTION_COLORS,
  TRIBE_COLORS,
} from '@pillage-first/game-assets/factions';
import { factionSchema } from '@pillage-first/types/models/faction';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { useGameWorldOverview } from 'app/(game)/(village-slug)/(statistics)/components/hooks/use-game-world-overview';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

export const GameWorldOverview = () => {
  const { t } = useTranslation();
  const { server } = useServer();
  const { gameWorldOverviewStatistics } = useGameWorldOverview();

  const playersByFactionData = useMemo(() => {
    return factionSchema.options.map((name) => ({
      name,
      value: gameWorldOverviewStatistics.playersByFaction[name],
      fill: FACTION_COLORS[name] ?? '#94a3b8',
    }));
  }, [gameWorldOverviewStatistics.playersByFaction]);

  const villagesByFactionData = useMemo(() => {
    return factionSchema.options.map((name) => ({
      name,
      value: gameWorldOverviewStatistics.villagesByFaction[name],
      fill: FACTION_COLORS[name] ?? '#94a3b8',
    }));
  }, [gameWorldOverviewStatistics.villagesByFaction]);

  const playersByTribeData = useMemo(() => {
    return tribeSchema.options.map((name) => ({
      name,
      value: gameWorldOverviewStatistics.playersByTribe[name],
      fill: TRIBE_COLORS[name] ?? '#94a3b8',
    }));
  }, [gameWorldOverviewStatistics.playersByTribe]);

  const villagesByTribeData = useMemo(() => {
    return tribeSchema.options.map((name) => ({
      name,
      value: gameWorldOverviewStatistics.villagesByTribe[name],
      fill: TRIBE_COLORS[name] ?? '#94a3b8',
    }));
  }, [gameWorldOverviewStatistics.villagesByTribe]);

  const serverStartDate = useMemo(() => {
    return new Date(server.createdAt).toLocaleDateString();
  }, [server.createdAt]);

  return (
    <Section>
      <Text as="h2">{t('Server overview')}</Text>
      <Text>{t('General statistics for this game world.')}</Text>

      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableBody>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Name')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.name}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Seed')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.seed}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Start date')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{serverStartDate}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Speed')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.configuration.speed}x</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Map size')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.configuration.mapSize}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Total players')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{gameWorldOverviewStatistics.playerCount}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Total villages')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{gameWorldOverviewStatistics.villageCount}</Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <SectionContent>
        <Text as="h3">{t('Players by Faction')}</Text>

        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <PieChart>
            <Pie
              data={playersByFactionData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <Text as="h3">{t('Villages by Faction')}</Text>
        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <PieChart>
            <Pie
              data={villagesByFactionData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <Text as="h3">{t('Players by Tribe')}</Text>
        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <BarChart data={playersByTribeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Legend />
            <Bar
              dataKey="value"
              name={t('Players')}
            />
          </BarChart>
        </ResponsiveContainer>

        <Text as="h3">{t('Villages by Tribe')}</Text>
        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <BarChart data={villagesByTribeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Legend />
            <Bar
              dataKey="value"
              name={t('Villages')}
            />
          </BarChart>
        </ResponsiveContainer>
      </SectionContent>
    </Section>
  );
};
