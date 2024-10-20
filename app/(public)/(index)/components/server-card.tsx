import { Button } from 'app/components/buttons/button';
import { CloseButton } from 'app/components/buttons/close-button';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import type { Server } from 'app/interfaces/models/game/server';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type React from 'react';
import { Link } from 'react-router-dom';

dayjs.extend(relativeTime);

type ServerCardProps = {
  server: Server;
};

export const ServerCard: React.FC<ServerCardProps> = (props) => {
  const { server } = props;

  const { deleteServer } = useAvailableServers();

  const serverCreatedAt = dayjs(server.createdAt);

  const timeSinceCreation = serverCreatedAt.fromNow(true);

  return (
    <div
      key={server.id}
      className="relative flex w-fit min-w-[350px] gap-16 rounded-md border border-gray-100 bg-transparent p-4 shadow-md"
    >
      <div className="absolute right-2 top-2">
        <CloseButton onClick={() => deleteServer({ server })} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-2xl font-medium">{server.name}</span>
        <span className="flex gap-2">
          <span className="font-medium">Seed:</span>
          <span>{server.seed}</span>
        </span>
        <span className="flex gap-2">
          <span className="font-medium">Age:</span>
          <span>{timeSinceCreation}</span>
        </span>
        <span className="flex gap-2">
          <span className="font-medium">Player name:</span>
          <span>{server.playerConfiguration.name}</span>
        </span>
        <span className="flex gap-2">
          <span className="font-medium">Tribe:</span>
          <span>{server.playerConfiguration.tribe}</span>
        </span>

        <div className="mt-4 flex">
          <Link
            viewTransition
            to={`/game/${server.slug}/v-1/resources`}
          >
            <Button variant="confirm">Enter server</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
