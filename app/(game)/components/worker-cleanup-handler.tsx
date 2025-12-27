import { use, useEffect } from 'react';
import { useLocation } from 'react-router';
import { ApiContext } from 'app/(game)/providers/api-provider';

type WorkerCleanupHandlerProps = {
  serverSlug: string;
};

export const WorkerCleanupHandler = ({
  serverSlug,
}: WorkerCleanupHandlerProps) => {
  const { pathname } = useLocation();
  const { apiWorker } = use(ApiContext);

  console.log('WorkerCleanupHandler');

  useEffect(() => {
    console.log('WorkerCleanupHandler useEffect start', pathname);

    if (!apiWorker) {
      return;
    }

    console.log('WorkerCleanupHandler useEffect !apiWorker');

    if (!pathname) {
      return;
    }

    console.log('WorkerCleanupHandler useEffect pathname');


    if (!pathname.includes(serverSlug)) {
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
  }, [apiWorker, pathname, serverSlug]);

  return null;
};
