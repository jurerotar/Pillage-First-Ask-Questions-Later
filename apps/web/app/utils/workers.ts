export const workerFactory = async <TReturn = void>(
  workerUrl: string | URL,
  payload?: unknown,
  transfer: Transferable[] = [],
): Promise<TReturn> => {
  return new Promise<TReturn>((resolve, reject) => {
    const worker: Worker = new Worker(workerUrl, { type: 'module' });
    const controller = new AbortController();

    const cleanup = () => {
      controller.abort();
      worker.terminate();
    };

    worker.addEventListener(
      'message',
      (event: MessageEvent<TReturn>) => {
        cleanup();
        resolve(event.data);
      },
      { signal: controller.signal },
    );

    worker.addEventListener(
      'error',
      (error: ErrorEvent) => {
        cleanup();
        reject(error);
      },
      { signal: controller.signal },
    );

    if (payload !== undefined) {
      worker.postMessage(payload, transfer);
    }
  });
};
