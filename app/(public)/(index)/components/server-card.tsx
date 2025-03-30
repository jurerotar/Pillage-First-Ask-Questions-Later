import { Button } from 'app/components/buttons/button';
import { CloseButton } from 'app/components/buttons/close-button';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import type { Server } from 'app/interfaces/models/game/server';
import type React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

type ServerCardProps = {
  server: Server;
};

export const ServerCard: React.FC<ServerCardProps> = (props) => {
  const { server } = props;

  const { t } = useTranslation();
  const { deleteServer } = useAvailableServers();

  const timeSinceCreation = formatDistanceToNow(new Date(server.createdAt), {
    addSuffix: false,
  });

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

        <div className="mt-4 flex">
          <Link to={`/game/${server.slug}/v-1/resources`}>
            <Button variant="confirm">{t('Enter server')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
