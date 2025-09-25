/// <reference lib="webworker" />

export const getRootHandle = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle('pillage-first-ask-questions-later', {
    create: true,
  });
};

export const getParsedFileContents = async <T>(
  serverHandle: FileSystemDirectoryHandle,
  name: string,
): Promise<T> => {
  const fileHandle = await serverHandle.getFileHandle(`${name}.json`);
  const file = await fileHandle.getFile();
  const text = await file.text();
  return JSON.parse(text);
};

export const writeFileContents = async <T>(
  serverHandle: FileSystemDirectoryHandle,
  name: string,
  data: T,
  onSuccess?: () => void,
  onError?: () => void,
): Promise<void> => {
  const textEncoder = new TextEncoder();
  const fileHandle = await serverHandle.getFileHandle(`${name}.json`, {
    create: true,
  });

  let encodedData: Uint8Array;

  try {
    const jsonString = JSON.stringify(data);
    encodedData = textEncoder.encode(jsonString);
  } catch (err) {
    onError?.();
    console.error('Failed to encode JSON:', err, data);
    return;
  }

  let syncHandle: FileSystemSyncAccessHandle | null = null;

  try {
    syncHandle = await fileHandle.createSyncAccessHandle();

    syncHandle.truncate(0);
    syncHandle.write(encodedData);
    onSuccess?.();
  } catch (err) {
    onError?.();
    console.error('Failed to write file:', err);
  } finally {
    if (syncHandle) {
      try {
        syncHandle.close();
      } catch (closeErr) {
        console.error('Failed to close sync handle:', closeErr);
      }
    }
  }
};

const createOpfsWriteQueue = () => {
  const queue: (() => Promise<void>)[] = [];
  let isWriting = false;

  return (task: () => Promise<void>) => {
    queue.push(task);

    if (isWriting) {
      return;
    }

    const process = async () => {
      isWriting = true;

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) {
          continue;
        }

        try {
          await current();
        } catch (err) {
          console.error('[writeQueue] Write failed:', err);
        }
      }

      isWriting = false;
    };

    void process();
  };
};

export const enqueueWrite = createOpfsWriteQueue();
