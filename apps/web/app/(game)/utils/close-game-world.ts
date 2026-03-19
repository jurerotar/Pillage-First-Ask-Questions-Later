export const closeGameWorld = (apiWorker: Worker): void => {
  const handler = ({ data }: MessageEvent) => {
    const { type } = data;

    if (type === 'WORKER_CLOSE_SUCCESS') {
      apiWorker.removeEventListener('message', handler);
      apiWorker.terminate();
    }
  };

  apiWorker.addEventListener('message', handler);
  apiWorker.postMessage({ type: 'WORKER_CLOSE' });
};
