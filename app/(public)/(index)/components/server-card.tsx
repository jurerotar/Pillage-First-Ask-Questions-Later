import { Button } from 'app/components/ui/button';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import type { Server } from 'app/interfaces/models/game/server';
import type React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { FaDownload, FaTrash } from 'react-icons/fa6';
import { Alert } from 'app/components/ui/alert';

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
      className="relative flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate flex-1">
          {server.name}
        </h4>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            data-tooltip-id="public-tooltip"
            data-tooltip-content="Export server"
            variant="ghost"
            size="sm"
            onClick={() => exportServer({ server })}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            <FaDownload className="h-3 w-3" />
          </Button>
          <Button
            data-tooltip-id="public-tooltip"
            data-tooltip-content="Delete server"
            variant="ghost"
            size="sm"
            onClick={() => deleteServer({ server })}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-400 hover:text-red-600"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-gray-600 text-xs">
            {t('Player')}
          </span>
          <span className="text-gray-800 truncate text-xs">
            {server.playerConfiguration.name}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-gray-600 text-xs">
            {t('Tribe')}
          </span>
          <span className="text-gray-800 truncate text-xs">
            {server.playerConfiguration.tribe}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-gray-600 text-xs">{t('Age')}</span>
          <span className="text-gray-800 truncate text-xs">
            {timeSinceCreation}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-gray-600 text-xs">
            {t('Speed')}
          </span>
          <span className="text-gray-800 text-xs">
            {server.configuration.speed}x
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-gray-600 text-xs">
            {t('World')}
          </span>
          <span className="text-gray-800 text-xs">
            {server.configuration.mapSize}x{server.configuration.mapSize}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-gray-600 text-xs">
            {t('Version')}
          </span>
          <span className="text-gray-800 text-xs">{serverVersion}</span>
        </div>
      </div>

      {serverVersion !== appVersion && (
        <div className="text-xs">
          <Alert variant="warning">
            Server version outdated. May not work with current app version.
          </Alert>
        </div>
      )}

      <Link
        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors duration-200"
        to={`/game/${server.slug}/v-1/resources`}
      >
        {t('Enter server')}
      </Link>
    </div>
  );
};
