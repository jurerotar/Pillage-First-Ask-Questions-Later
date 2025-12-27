import { use, useEffect } from 'react';
import { useLocation, useNavigation } from 'react-router';
import { ApiContext } from 'app/(game)/providers/api-provider';

type WorkerCleanupHandlerProps = {
  serverSlug: string;
};

export const WorkerCleanupHandler = ({
  serverSlug,
}: WorkerCleanupHandlerProps) => {
  const navigation = useNavigation();
  const location = useLocation();
  const { apiWorker } = use(ApiContext);

  useEffect(() => {
    console.log('WorkerCleanupHandler useEffect start', location.pathname, navigation);

    if (!apiWorker) {
      return;
    }

    console.log('WorkerCleanupHandler useEffect !apiWorker');

    if (!location.pathname) {
      return;
    }

    console.log('WorkerCleanupHandler useEffect pathname');


    if (!location.pathname.includes(serverSlug)) {
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
  }, [apiWorker, location, serverSlug, navigation]);

  return null;
};
