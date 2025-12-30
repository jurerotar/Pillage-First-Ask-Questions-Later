import { use } from 'react';
import { FaDownload } from 'react-icons/fa';
import { FaTrash } from 'react-icons/fa6';
import { Link } from 'react-router';
import type { Server } from '@pillage-first/types/models/server';
import { useGameWorldActions } from 'app/(public)/(game-worlds)/hooks/use-game-world-actions';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Badge } from 'app/components/ui/badge';
import { Button } from 'app/components/ui/button';
import { env } from 'app/env';
import { CookieContext } from 'app/providers/cookie-provider';
import { daysSince } from 'app/utils/time';

type ServerCardProps = {
  server: Server;
};

export const ServerCard = ({ server }: ServerCardProps) => {
  const { locale } = use(CookieContext);
  const { exportGameWorld, deleteGameWorld } = useGameWorldActions();

  const timeSinceCreation = daysSince(server.createdAt, locale);

  const serverVersion = server.version ?? '0.0.0';

  return (
    <div
      key={server.id}
      className="relative flex flex-col w-full md:w-auto md:min-w-100 gap-2 rounded-xs border border-border bg-transparent p-2 px-4 shadow-lg"
    >
      <div className="absolute right-2 top-2 inline-flex gap-2 items-center">
        <Button
          data-tooltip-id="public-tooltip"
          data-tooltip-content="Export server"
          variant="outline"
          onClick={() => exportGameWorld({ server })}
        >
          <FaDownload className="text-gray-400" />
        </Button>
        <Button
          data-tooltip-id="public-tooltip"
          data-tooltip-content="Delete server"
          variant="outline"
          onClick={() => deleteGameWorld({ server })}
        >
          <FaTrash className="text-red-500" />
        </Button>
      </div>
      <Text as="h2">{server.name}</Text>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="successive">{server.configuration.speed}x</Badge>
        <Badge variant="successive">{server.playerConfiguration.tribe}</Badge>
        <Badge variant="successive">
          {server.configuration.mapSize}x{server.configuration.mapSize}
        </Badge>
        <Badge variant="successive">v{serverVersion}</Badge>
      </div>
      <div className="flex gap-2 flex-wrap">
        <span className="flex gap-2">
          <Text className="font-medium">Seed:</Text>
          <Text>
            <code>{server.seed}</code>
          </Text>
        </span>
        <span className="flex gap-2">
          <Text className="font-medium">Created:</Text>
          <Text>{timeSinceCreation}</Text>
        </span>
      </div>
      {serverVersion !== env.VERSION && (
        <Alert variant="error">
          Your server version is outdated. It may not work with current version
          of the app. In case of error, delete and recreate server.
        </Alert>
      )}
      <Link to={`/game/${server.slug}/v-1/resources`}>
        <Button variant="default">Enter server</Button>
      </Link>
    </div>
  );
};
