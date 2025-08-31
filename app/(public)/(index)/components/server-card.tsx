import { Button } from 'app/components/ui/button';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import type { Server } from 'app/interfaces/models/game/server';
import type React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { FaDownload, FaTrash } from 'react-icons/fa6';
import { Alert } from 'app/components/ui/alert';
import { Text } from 'app/components/text';

type ServerCardProps = {
  server: Server;
};

export const ServerCard: React.FC<ServerCardProps> = (props) => {
  const { server } = props;

  const { t } = useTranslation('public');
  const { deleteServer, exportServer } = useAvailableServers();

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
      <div className="absolute right-2 top-2 inline-flex gap-2 items-center">
        <Button
          data-tooltip-id="public-tooltip"
          data-tooltip-content="Export server"
          variant="outline"
          onClick={() => exportServer({ server })}
        >
          <FaDownload className="text-gray-400" />
        </Button>
        <Button
          data-tooltip-id="public-tooltip"
          data-tooltip-content="Delete server"
          variant="outline"
          onClick={() => deleteServer({ server })}
        >
          <FaTrash className="text-red-500" />
        </Button>
      </div>
      <Text as="h2">{server.name}</Text>
      <div className="flex gap-2 flex-wrap">
        <span className="flex gap-2">
          <Text className="font-medium">{t('Seed')}:</Text>
          <Text>{server.seed}</Text>
        </span>
        <span className="flex gap-2">
          <Text className="font-medium">{t('Age')}:</Text>
          <Text>{timeSinceCreation}</Text>
        </span>
        <span className="flex gap-2">
          <Text className="font-medium">{t('Player name')}:</Text>
          <Text>{server.playerConfiguration.name}</Text>
        </span>
        <span className="flex gap-2">
          <Text className="font-medium">{t('Tribe')}:</Text>
          <Text>{server.playerConfiguration.tribe}</Text>
        </span>
        <span className="flex gap-2">
          <Text className="font-medium">{t('World size')}:</Text>
          <Text>
            {server.configuration.mapSize}x{server.configuration.mapSize}
          </Text>
        </span>
        <span className="flex gap-2">
          <Text className="font-medium">{t('Speed')}:</Text>
          <Text>{server.configuration.speed}x</Text>
        </span>
        <span className="flex gap-2">
          <Text className="font-medium">{t('Version')}:</Text>
          <Text>{serverVersion}</Text>
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
