export const workerFactory = async <TPayload = void, TReturn = void>(
  workerUrl: string | URL,
  payload?: TPayload,
): Promise<TReturn> => {
  return new Promise<TReturn>((resolve) => {
    const worker: Worker = new Worker(workerUrl, { type: 'module' });

    if (payload) {
      worker.postMessage(payload);
    }

    const handleMessage = (event: MessageEvent<TReturn>) => {
      worker.removeEventListener('message', handleMessage);
      worker.terminate();

      resolve(event.data);
    };

    worker.addEventListener('message', handleMessage);
  });
};
