export const workerFactory = async <TReturn = void>(
  workerUrl: string | URL,
  payload?: unknown,
  transfer: Transferable[] = [],
): Promise<TReturn> => {
  return new Promise<TReturn>((resolve, reject) => {
    const worker: Worker = new Worker(workerUrl, { type: 'module' });

    if (payload !== undefined) {
      worker.postMessage(payload, transfer);
    }

    worker.onmessage = (event: MessageEvent<TReturn>) => {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();

      resolve(event.data);
    };

    worker.onerror = (error: ErrorEvent) => {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();

      reject(error);
    };
  });
};
