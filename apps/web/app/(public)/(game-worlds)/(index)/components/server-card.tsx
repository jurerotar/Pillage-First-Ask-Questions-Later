import { use, useState } from 'react';
import {
  FaDownload,
  FaEllipsisVertical,
  FaSpinner,
  FaTrash,
} from 'react-icons/fa6';
import { IoCopyOutline } from 'react-icons/io5';
import { Link } from 'react-router';
import type { Server } from '@pillage-first/types/models/server';
import { env } from '@pillage-first/utils/env';
import { parseAppVersion } from '@pillage-first/utils/version';
import { useGameWorldActions } from 'app/(public)/(game-worlds)/hooks/use-game-world-actions';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Badge } from 'app/components/ui/badge';
import { Button } from 'app/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';
import { CookieContext } from 'app/providers/cookie-provider';
import { daysSince } from 'app/utils/time';

type ServerCardProps = {
  server: Server;
};

export const ServerCard = ({ server }: ServerCardProps) => {
  const { locale } = use(CookieContext);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const {
    exportGameWorld,
    isExportGameWorldPending,
    duplicateGameWorld,
    isDuplicateGameWorldPending,
    deleteGameWorld,
    isDeleteGameWorldPending,
  } = useGameWorldActions();

  const isActionPending =
    isExportGameWorldPending ||
    isDuplicateGameWorldPending ||
    isDeleteGameWorldPending;

  const appVersion = env.VERSION;

  const timeSinceCreation = daysSince(server.createdAt, locale);

  const gameWorldVersion = server.version ?? '0.0.0';

  const [appMajor, appMinor] = parseAppVersion(appVersion);
  const [gameWorldMajor, gameWorldMinor] = parseAppVersion(gameWorldVersion);

  const shouldDisplayGameWorldOutdatedAlert =
    appMajor !== gameWorldMajor || appMinor !== gameWorldMinor;

  return (
    <div
      key={server.id}
      className="relative flex flex-col w-full md:w-auto md:min-w-100 gap-2 rounded-xs border border-border bg-transparent p-2 px-4 shadow-lg"
    >
      <Popover
        open={isActionsOpen}
        onOpenChange={setIsActionsOpen}
      >
        <PopoverTrigger asChild>
          <Button
            aria-label="Game world actions"
            aria-busy={isActionPending}
            className="absolute right-2 top-2 rounded-full border-border/70 bg-background/80 shadow-sm backdrop-blur-sm"
            disabled={isActionPending}
            size="icon"
            variant="outline"
          >
            {isActionPending ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaEllipsisVertical />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="rounded-lg p-1 shadow-xl"
          side="bottom"
        >
          <div className="flex flex-col">
            <Button
              className="h-8 justify-start gap-2 px-2 text-xs"
              disabled={isActionPending}
              variant="ghost"
              onClick={() => {
                setIsActionsOpen(false);
                void exportGameWorld({ server });
              }}
            >
              {isExportGameWorldPending ? (
                <FaSpinner className="text-gray-400 animate-spin size-3.5" />
              ) : (
                <FaDownload className="text-gray-400 size-3.5" />
              )}
              {isExportGameWorldPending
                ? 'Exporting game world...'
                : 'Export game world'}
            </Button>
            <Button
              className="h-8 justify-start gap-2 px-2 text-xs"
              disabled={isActionPending}
              variant="ghost"
              onClick={() => {
                setIsActionsOpen(false);
                void duplicateGameWorld({ server });
              }}
            >
              {isDuplicateGameWorldPending ? (
                <FaSpinner className="text-gray-400 animate-spin size-3.5" />
              ) : (
                <IoCopyOutline className="text-gray-400 size-3.5" />
              )}
              {isDuplicateGameWorldPending
                ? 'Duplicating game world...'
                : 'Duplicate game world'}
            </Button>
            <Button
              className="h-8 justify-start gap-2 px-2 text-xs text-red-500 hover:text-red-500"
              disabled={isActionPending}
              variant="ghost"
              onClick={() => {
                setIsActionsOpen(false);
                void deleteGameWorld({ server });
              }}
            >
              {isDeleteGameWorldPending ? (
                <FaSpinner className="animate-spin size-3.5" />
              ) : (
                <FaTrash className="size-3.5" />
              )}
              {isDeleteGameWorldPending
                ? 'Deleting game world...'
                : 'Delete game world'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Text as="h2">{server.name}</Text>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="successive">{server.configuration.speed}x</Badge>
        <Badge variant="successive">{server.playerConfiguration.tribe}</Badge>
        <Badge variant="successive">
          {server.configuration.mapSize}x{server.configuration.mapSize}
        </Badge>
        <Badge variant="successive">v{gameWorldVersion}</Badge>
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
      {shouldDisplayGameWorldOutdatedAlert && (
        <Alert variant="error">
          This game world is incompatible with the latest version of the app. In
          case of error, create a new game world. Check the{' '}
          <Link
            className="underline"
            to="../latest-updates"
          >
            latest updates page
          </Link>{' '}
          for more information.
        </Alert>
      )}
      <Link to={`/game/${server.slug}/v-1/resources`}>
        <Button variant="default">Enter server</Button>
      </Link>
    </div>
  );
};
