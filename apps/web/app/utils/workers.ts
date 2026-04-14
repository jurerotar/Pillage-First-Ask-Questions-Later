export const workerFactory = async <TPayload = void, TReturn = void>(
  workerUrl: string | URL,
  payload?: TPayload,
): Promise<TReturn> => {
  return new Promise<TReturn>((resolve, reject) => {
    const worker: Worker = new Worker(workerUrl, { type: 'module' });

    if (payload) {
      worker.postMessage(payload);
    }

    const handleMessage = (event: MessageEvent<TReturn>) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      worker.terminate();

      resolve(event.data);
    };

    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      worker.terminate();

      reject(error);
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
  });
};
