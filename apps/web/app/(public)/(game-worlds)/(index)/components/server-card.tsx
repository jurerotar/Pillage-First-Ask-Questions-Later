import { useState } from 'react';
import {
  FaCheck,
  FaCopy,
  FaDownload,
  FaEllipsisVertical,
  FaPen,
  FaSpinner,
  FaThumbtack,
  FaTrash,
  FaWandMagicSparkles,
  FaXmark,
} from 'react-icons/fa6';
import { IoCopyOutline } from 'react-icons/io5';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { Server } from '@pillage-first/types/models/server';
import { env } from '@pillage-first/utils/env';
import { parseAppVersion } from '@pillage-first/utils/version';
import { useGameWorldActions } from 'app/(public)/(game-worlds)/hooks/use-game-world-actions';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Badge } from 'app/components/ui/badge';
import { Button } from 'app/components/ui/button';
import { Input } from 'app/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';
import { useIntl } from 'app/hooks/use-intl';
import { daysSince } from 'app/utils/time';

type ServerCardProps = {
  server: Server;
  isPinned: boolean;
};

export const ServerCard = ({ server, isPinned }: ServerCardProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(server.name);
  const {
    exportGameWorld,
    isExportGameWorldPending,
    duplicateGameWorld,
    isDuplicateGameWorldPending,
    deleteGameWorld,
    isDeleteGameWorldPending,
    renameGameWorld,
    isRenameGameWorldPending,
    toggleGameWorldPin,
    isPinGameWorldPending,
  } = useGameWorldActions();

  const isActionPending =
    isExportGameWorldPending ||
    isDuplicateGameWorldPending ||
    isDeleteGameWorldPending ||
    isRenameGameWorldPending ||
    isPinGameWorldPending;

  const handleRename = async () => {
    const trimmedName = name.trim();

    if (!trimmedName || trimmedName === server.name) {
      setName(server.name);
      setIsRenaming(false);
      return;
    }

    try {
      await renameGameWorld({ server, name: trimmedName });
      setIsRenaming(false);
    } catch {
      // The mutation displays the error toast.
    }
  };

  const handleCopySeed = async () => {
    try {
      await navigator.clipboard.writeText(server.seed);
      toast.success('Seed copied to clipboard');
    } catch {
      toast.error('Failed to copy seed');
    }
  };

  const appVersion = env.VERSION;

  const timeSinceCreation = daysSince(server.createdAt, intl);

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
              className="h-8 justify-start gap-2 px-2 text-xs"
              disabled={isActionPending}
              variant="ghost"
              onClick={() => {
                setIsActionsOpen(false);
                void navigate('/game-worlds/create', {
                  state: { gameWorldTemplate: server },
                });
              }}
            >
              <FaWandMagicSparkles className="text-gray-400 size-3.5" />
              Create from same settings
            </Button>
            <Button
              className="h-8 justify-start gap-2 px-2 text-xs"
              disabled={isActionPending}
              variant="ghost"
              onClick={() => {
                setIsActionsOpen(false);
                void handleCopySeed();
              }}
            >
              <FaCopy className="text-gray-400 size-3.5" />
              Copy seed
            </Button>
            <Button
              className="h-8 justify-start gap-2 px-2 text-xs"
              disabled={isActionPending}
              variant="ghost"
              onClick={() => {
                setIsActionsOpen(false);
                void toggleGameWorldPin({ server });
              }}
            >
              <FaThumbtack className="text-gray-400 size-3.5" />
              {isPinned ? 'Unpin game world' : 'Pin game world'}
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
      <div className="flex items-center gap-1 pr-10 min-h-8">
        {isRenaming ? (
          <form
            className="flex items-center gap-1 w-full"
            onSubmit={(event) => {
              event.preventDefault();
              void handleRename();
            }}
          >
            <Input
              aria-label="Game world name"
              autoFocus
              className="h-8"
              disabled={isRenameGameWorldPending}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setName(server.name);
                  setIsRenaming(false);
                }
              }}
            />
            <Button
              aria-label="Save game world name"
              className="size-8 shrink-0"
              disabled={isRenameGameWorldPending || !name.trim()}
              size="icon"
              type="submit"
              variant="ghost"
            >
              {isRenameGameWorldPending ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaCheck />
              )}
            </Button>
            <Button
              aria-label="Cancel renaming game world"
              className="size-8 shrink-0"
              disabled={isRenameGameWorldPending}
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => {
                setName(server.name);
                setIsRenaming(false);
              }}
            >
              <FaXmark />
            </Button>
          </form>
        ) : (
          <>
            <Text as="h2">{server.name}</Text>
            {isPinned && (
              <FaThumbtack
                aria-label="Pinned game world"
                className="size-3.5 text-muted-foreground"
              />
            )}
            <Button
              aria-label="Rename game world"
              className="size-7"
              disabled={isActionPending}
              size="icon"
              variant="ghost"
              onClick={() => {
                setName(server.name);
                setIsActionsOpen(false);
                setIsRenaming(true);
              }}
            >
              <FaPen className="size-3.5" />
            </Button>
          </>
        )}
      </div>
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
