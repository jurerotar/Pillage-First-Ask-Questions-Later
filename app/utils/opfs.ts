export const getRootHandle = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle('pillage-first-ask-questions-later', { create: true });
};

export const getParsedFileContents = async <T>(serverHandle: FileSystemDirectoryHandle, name: string): Promise<T> => {
  const fileHandle = await serverHandle.getFileHandle(`${name}.json`);
  const file = await fileHandle.getFile();
  const text = await file.text();
  return JSON.parse(text);
};

export const writeFileContents = async <T>(serverHandle: FileSystemDirectoryHandle, name: string, data: T): Promise<void> => {
  const textEncoder = new TextEncoder();
  const file = await serverHandle.getFileHandle(`${name}.json`, { create: true });

  const syncHandle = await file.createSyncAccessHandle();

  try {
    syncHandle.truncate(0);
    syncHandle.write(textEncoder.encode(JSON.stringify(data)));
  } finally {
    syncHandle.close();
  }
};

const createOpfsWriteQueue = () => {
  let pendingWrite: (() => Promise<void>) | null = null;
  let isWriting = false;

  return (task: () => Promise<void>) => {
    pendingWrite = task;

    if (isWriting) {
      return;
    }

    const process = async () => {
      while (pendingWrite) {
        const current = pendingWrite;
        pendingWrite = null;
        isWriting = true;

        try {
          await current();
        } catch (err) {
          console.error('[writeQueue] Write failed:', err);
        }
      }

      isWriting = false;
    };

    // Don't await, just run
    void process();
  };
};

export const enqueueWrite = createOpfsWriteQueue();
