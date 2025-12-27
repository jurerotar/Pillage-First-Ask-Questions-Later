import { use, useEffect } from 'react';
import { useNavigation } from 'react-router';
import { ApiContext } from 'app/(game)/providers/api-provider';

type WorkerCleanupHandlerProps = {
  serverSlug: string;
};

export const WorkerCleanupHandler = ({
  serverSlug,
}: WorkerCleanupHandlerProps) => {
  const navigation = useNavigation();
  const { apiWorker } = use(ApiContext);

  console.log('WorkerCleanupHandler');

  useEffect(() => {
    console.log('WorkerCleanupHandler useEffect start');

    if (!apiWorker) {
      return;
    }

    if (!navigation.location?.pathname) {
      return;
    }

    if (!navigation.location.pathname.includes(serverSlug)) {
      console.log('WorkerCleanupHandler useEffect third branch');

      const handler = ({ data }: MessageEvent) => {
        const { type } = data;

        if (type === 'WORKER_CLOSE_SUCCESS') {
          apiWorker.removeEventListener('message', handler);
          console.log('terminate');
          apiWorker.terminate();
        }
      };

      apiWorker.addEventListener('message', handler);
      console.log('close call');
      apiWorker.postMessage({ type: 'WORKER_CLOSE' });
    }
  }, [apiWorker, navigation, serverSlug]);

  return null;
};
