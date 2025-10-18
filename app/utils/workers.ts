export const workerFactory = async <TPayload, TReturn = void>(
  worker: string,
  payload: TPayload,
): Promise<TReturn> => {
  return new Promise<TReturn>((resolve) => {
    const workerInstance: Worker = new Worker(worker, { type: 'module' });
    workerInstance.postMessage(payload);
    workerInstance.addEventListener(
      'message',
      (event: MessageEvent<TReturn>) => {
        resolve(event.data);
      },
    );
  });
};
