import { useNavigation } from 'react-router';
import { use, useEffect } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

type WorkerCleanupHandlerProps = {
  serverSlug: string;
};

export const WorkerCleanupHandler = ({
  serverSlug,
}: WorkerCleanupHandlerProps) => {
  const navigation = useNavigation();
  const { apiWorker } = use(ApiContext);

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    if (!navigation.location?.pathname) {
      return;
    }

    if (!navigation.location.pathname.includes(serverSlug)) {
      apiWorker.postMessage({ type: 'WORKER_CLOSE' });
    }
  }, [apiWorker, navigation, serverSlug]);

  return null;
};
