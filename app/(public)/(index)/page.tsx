import { ServerCard } from 'app/(public)/(index)/components/server-card';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import type { Server } from 'app/interfaces/models/game/server';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import { Text } from 'app/components/text';
import { Suspense } from 'react';

const ServerList = () => {
  const { availableServers } = useAvailableServers();

  if (availableServers.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2 w-full">
      {availableServers.map((server: Server) => (
        <ServerCard
          key={server.id}
          server={server}
        />
      ))}
    </section>
  );
};

const HomePage = () => {
  const { t } = useTranslation('public');

  return (
    <>
      <main className="flex flex-col">
        <div className="container relative mx-auto flex min-h-[300px] flex-col gap-2 lg:flex-row">
          <section className="flex flex-1 flex-col gap-2 p-2">
            <h1 className="text-3xl font-semibold text-gray-800">Pillage First! (Ask Questions Later)</h1>
            <span className="text-gray-800">
              <b>Pillage First! (Ask Questions Later)</b> is a <b>single-player</b>, <b>real-time</b>, <b>browser-based strategy game</b>{' '}
              inspired by <b>Travian</b>. Manage resources to construct buildings, train units, and wage war against your enemies.
              <br /> <br />
              <b>Remember: pillage first, ask questions later!</b>
            </span>
            <Alert variant="warning">
              Game is still in development, most features are missing. <br /> To see the current list of available features, see{' '}
              <a
                rel="noreferrer"
                className="underline text-blue-600"
                target="_blank"
                href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/blob/master/docs/ROADMAP.md"
              >
                roadmap
              </a>{' '}
              or{' '}
              <a
                rel="noopener noreferrer"
                className="text-blue-500 underline"
                target="_blank"
                href="https://discord.gg/Ep7NKVXUZA"
              >
                join our Discord server
              </a>
              .
            </Alert>
          </section>
          <section className="flex flex-1 flex-col p-2 gap-4">
            <Text
              as="h2"
              className="font-semibold text-2xl"
            >
              Server list
            </Text>
            <Link
              className="underline text-blue-600 font-semibold"
              to="/create-new-server"
            >
              {t('Create new server')}
            </Link>
            <Suspense fallback={null}>
              <ServerList />
            </Suspense>
          </section>
        </div>
      </main>
    </>
  );
};

export default HomePage;
