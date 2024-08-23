import type { OPFSFileName } from 'interfaces/models/common';
import type { Server } from 'interfaces/models/game/server';

export const getRootHandle = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle('echoes-of-travian', { create: true });
};

export const getServerHandle = async (serverSlug: Server['slug']): Promise<FileSystemDirectoryHandle> => {
  const rootHandle = await getRootHandle();
  return rootHandle.getDirectoryHandle(serverSlug, { create: true });
};

export const getParsedFileContents = async <T>(serverHandle: FileSystemDirectoryHandle, name: OPFSFileName): Promise<T> => {
  const fileHandle = await serverHandle.getFileHandle(`${name}.json`);
  const file = await fileHandle.getFile();
  const text = await file.text();
  return JSON.parse(text);
};

export const writeFileContents = async <T>(serverHandle: FileSystemDirectoryHandle, name: OPFSFileName, data: T) => {
  const textEncoder = new TextEncoder();
  const file = await serverHandle.getFileHandle(`${name}.json`, { create: true });
  const syncHandle = await file.createSyncAccessHandle();
  syncHandle.truncate(0);
  syncHandle.write(textEncoder.encode(JSON.stringify(data)));
  syncHandle.close();
};
