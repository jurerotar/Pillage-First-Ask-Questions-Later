export const getRootHandle = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle('echoes-of-travian', { create: true });
};

export const getParsedFileContents = async <T>(serverHandle: FileSystemDirectoryHandle, name: string): Promise<T> => {
  const fileHandle = await serverHandle.getFileHandle(`${name}.json`);
  const file = await fileHandle.getFile();
  const text = await file.text();
  return JSON.parse(text);
};

export const writeFileContents = async <T>(serverHandle: FileSystemDirectoryHandle, name: string, data: T) => {
  const textEncoder = new TextEncoder();
  const file = await serverHandle.getFileHandle(`${name}.json`, { create: true });
  const syncHandle = await file.createSyncAccessHandle();
  syncHandle.truncate(0);
  syncHandle.write(textEncoder.encode(JSON.stringify(data)));
  syncHandle.close();
};
