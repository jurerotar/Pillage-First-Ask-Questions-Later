import { beforeAll } from 'vitest';

type FileData = { content: string };

interface InMemoryFileSystemFileHandle {
  name: string;
  data: FileData;
  getFile: () => Promise<File>;
  createSyncAccessHandle: () => Promise<{
    write: (data: Uint8Array, options: { at: number }) => Promise<void>;
    flush: () => Promise<void>;
    close: () => Promise<void>;
    truncate: (size: number) => Promise<void>;
  }>;
}

interface InMemoryFileSystemDirectoryHandle {
  name: string;
  files: Map<string, InMemoryFileSystemFileHandle>;
  directories: Map<string, InMemoryFileSystemDirectoryHandle>;
  getFileHandle: (name: string, options?: { create: boolean }) => Promise<InMemoryFileSystemFileHandle>;
  getDirectoryHandle: (name: string, options?: { create: boolean }) => Promise<InMemoryFileSystemDirectoryHandle>;
  removeEntry: (name: string) => Promise<void>;
  keys: () => string[];
}

const createInMemoryFileSystemFileHandle = (name: string, fileData: FileData): InMemoryFileSystemFileHandle => {
  return {
    name,
    data: fileData,
    getFile: async () => new File([fileData.content], name, { type: 'application/json' }),
    createSyncAccessHandle: async () => ({
      write: async (data: Uint8Array, _options?: { at?: number }) => {
        fileData.content = new TextDecoder().decode(data);
      },
      flush: async () => {},
      close: async () => {},
      truncate: async (size: number) => {
        fileData.content = fileData.content.slice(0, size);
      },
    }),
  };
};

const createInMemoryFileSystemDirectoryHandle = (name: string): InMemoryFileSystemDirectoryHandle => {
  const files = new Map<string, InMemoryFileSystemFileHandle>();
  const directories = new Map<string, InMemoryFileSystemDirectoryHandle>();

  return {
    name,
    files,
    directories,
    getFileHandle: async (name: string, options?: { create: boolean }) => {
      if (!files.has(name) && options?.create) {
        files.set(name, createInMemoryFileSystemFileHandle(name, { content: '' }));
      }
      const fileHandle = files.get(name);
      if (!fileHandle) {
        throw new Error(`File not found: ${name}`);
      }
      return fileHandle;
    },
    getDirectoryHandle: async (name: string, options?: { create: boolean }) => {
      if (!directories.has(name) && options?.create) {
        directories.set(name, createInMemoryFileSystemDirectoryHandle(name));
      }
      const directoryHandle = directories.get(name);
      if (!directoryHandle) {
        throw new Error(`Directory not found: ${name}`);
      }
      return directoryHandle;
    },
    removeEntry: async (name: string) => {
      if (files.has(name)) {
        files.delete(name);
      } else if (directories.has(name)) {
        directories.delete(name);
      } else {
        throw new Error(`Entry not found: ${name}`);
      }
    },

    keys: () => {
      return Array.from(directories.keys());
    },
  };
};

const mockOpfs = () => {
  const root = createInMemoryFileSystemDirectoryHandle('root');
  Object.defineProperty(globalThis.navigator, 'storage', {
    value: {
      getDirectory: () => root,
    },
    writable: true,
  });
};

beforeAll(() => {
  mockOpfs();

  return () => {
    mockOpfs();
  };
});
