import { ServerCard } from 'app/(public)/(index)/components/server-card';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import type { Server } from 'app/interfaces/models/game/server';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { WarningAlert } from 'app/components/alert';

const HomePage = () => {
  const { t } = useTranslation();
  const { availableServers } = useAvailableServers();

  return (
    <>
      <main className="flex flex-col">
        <div className="container relative mx-auto flex min-h-[300px] flex-col gap-2 lg:flex-row">
          <section className="flex flex-1 flex-col justify-center gap-2 p-2">
            <h1 className="text-3xl font-semibold text-gray-800">Pillage First! (Ask Questions Later)</h1>
            <span className="text-gray-800">
              <b>Pillage First! (Ask Questions Later)</b> is a <b>single-player</b>, <b>real-time</b>,{' '}
              <b>browser-based strategy game inspired</b> by <b>Travian</b>. Manage resources to construct buildings, train units, and wage
              war against your enemies.
              <br /> <br />
              <b>Remember: pillage first, ask questions later!</b>
            </span>
            <WarningAlert>Game is still in development, most features are missing.</WarningAlert>
          </section>
          <section className="flex flex-1 flex-col items-start justify-center p-2 gap-4">
            <h2 className="font-semibold text-2xl">Server list</h2>
            <Link
              className="underline text-blue-600 font-semibold"
              to="/create-new-server"
            >
              {t('Create new server')}
            </Link>
            {availableServers.length > 0 && (
              <section className="flex flex-col gap-2 w-full">
                {availableServers.map((server: Server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                  />
                ))}
              </section>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default HomePage;
