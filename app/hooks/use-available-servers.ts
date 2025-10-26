import { useMutation, useQuery } from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import { getRootHandle } from 'app/utils/opfs';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import { toast } from 'sonner';

const deleteServerData = async (server: Server) => {
  const rootHandle = await getRootHandle();

  const sqliteFileName = `${server.slug}.sqlite3`;
  const legacy_jsonFileName = `${server.slug}.json`;

  let sawLockedError = false;

  try {
    await rootHandle.removeEntry(sqliteFileName);
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'NoModificationAllowedError'
    ) {
      sawLockedError = true;
    }
  }

  try {
    await rootHandle.removeEntry(legacy_jsonFileName);
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'NoModificationAllowedError'
    ) {
      sawLockedError = true;
    }
  }

  if (sawLockedError) {
    toast.error("Server couldn't be deleted", {
      description:
        'Database file was still locked by the browser. Try again in a few seconds!',
    });
    return;
  }

  const servers: Server[] = JSON.parse(
    window.localStorage.getItem(availableServerCacheKey) ?? '[]',
  );
  window.localStorage.setItem(
    availableServerCacheKey,
    JSON.stringify(servers.filter(({ id }) => id !== server.id)),
  );
};

export const useAvailableServers = () => {
  const { data: availableServers } = useQuery<Server[]>({
    queryKey: [availableServerCacheKey],
    queryFn: async () => {
      return JSON.parse(
        window.localStorage.getItem(availableServerCacheKey) ?? '[]',
      );
    },
    initialData: [],
  });

  const { mutate: addServer } = useMutation<void, Error, { server: Server }>({
    mutationFn: async ({ server }) => {
      const servers: Server[] = JSON.parse(
        window.localStorage.getItem(availableServerCacheKey) ?? '[]',
      );
      window.localStorage.setItem(
        availableServerCacheKey,
        JSON.stringify([...servers, server]),
      );
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await context.client.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  const { mutateAsync: deleteServer } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: ({ server }) => deleteServerData(server),
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await context.client.invalidateQueries({
        queryKey: [availableServerCacheKey],
      });
    },
  });

  const { mutateAsync: exportServer } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: async ({ server }) => {
      const rootHandle = await getRootHandle();

      const sqliteFileName = `${server.slug}.sqlite3`;
      const fileHandle = await rootHandle.getFileHandle(sqliteFileName, {
        create: false,
      });

      const file = await fileHandle.getFile();
      const blob = new Blob([await file.arrayBuffer()], {
        type: 'application/x-sqlite3',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = sqliteFileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  });

  return {
    availableServers,
    addServer,
    deleteServer,
    exportServer,
  };
};
