import { Button } from 'app/components/ui/button';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import type { Server } from 'app/interfaces/models/game/server';
import type React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { FaTrash } from 'react-icons/fa6';
import { Alert } from 'app/components/ui/alert';

type ServerCardProps = {
  server: Server;
};

export const ServerCard: React.FC<ServerCardProps> = (props) => {
  const { server } = props;

  const { t } = useTranslation('public');
  const { deleteServer } = useAvailableServers();

  const appVersion = import.meta.env.VERSION;

  const timeSinceCreation = formatDistanceToNow(new Date(server.createdAt), {
    addSuffix: false,
  });

  const serverVersion = server.version ?? '0.0.0';

  return (
    <div
      key={server.id}
      className="relative flex flex-col w-full md:w-auto md:min-w-[400px] gap-2 rounded-xs border border-border bg-transparent p-2 px-4 shadow-lg"
    >
      <div className="absolute right-2 top-2">
        <Button
          variant="outline"
          onClick={() => deleteServer({ server })}
        >
          <FaTrash className="text-red-500" />
        </Button>
      </div>
      <span className="text-2xl font-medium">{server.name}</span>
      <div className="flex gap-2 flex-wrap">
        <span className="flex gap-2">
          <span className="font-medium">{t('Seed')}:</span>
          <span>{server.seed}</span>
        </span>
        <span className="flex gap-2">
          <span className="font-medium">{t('Age')}:</span>
          <span>{timeSinceCreation}</span>
        </span>
        <span className="flex gap-2">
          <span className="font-medium">{t('Player name')}:</span>
          <span>{server.playerConfiguration.name}</span>
        </span>
        <span className="flex gap-2">
          <span className="font-medium">{t('Tribe')}:</span>
          <span>{server.playerConfiguration.tribe}</span>
        </span>
        <span className="flex gap-2">
          <span className="font-medium">{t('World size')}:</span>
          <span>
            {server.configuration.mapSize}x{server.configuration.mapSize}
          </span>
        </span>
        <span className="flex gap-2">
          <span className="font-medium">{t('Speed')}:</span>
          <span>{server.configuration.speed}x</span>
        </span>
        <span className="flex gap-2">
          <span className="font-medium">{t('Version')}:</span>
          <span>{serverVersion}</span>
        </span>
      </div>
      {serverVersion !== appVersion && (
        <Alert variant="warning">
          Your server version is outdated. It may not work with current version
          of the app. In case of error, delete and recreate server.
        </Alert>
      )}
      <Link
        className="text-green-600 underline font-semibold"
        to={`/game/${server.slug}/v-1/resources`}
      >
        {t('Enter server')}
      </Link>
    </div>
  );
};
