export const workerFactory = async <TPayload, TReturn = void>(
  worker: string,
  payload: TPayload,
  errorMessage: string,
): Promise<TReturn> => {
  return new Promise<TReturn>((resolve, reject) => {
    const workerInstance: Worker = new Worker(worker, { type: 'module' });
    workerInstance.postMessage(payload);
    workerInstance.addEventListener('message', async (event: MessageEvent<TReturn>) => {
      resolve(event.data);
    });
    workerInstance.addEventListener('error', () => {
      reject(new Error(errorMessage));
    });
  });
};
