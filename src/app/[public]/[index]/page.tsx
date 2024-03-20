import React, { lazy } from 'react';
import { Server } from 'interfaces/models/game/server';
import { Button } from 'app/components/buttons/button';
import { Head } from 'app/components/head';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import { useDialog } from 'app/hooks/use-dialog';
import { Modal } from 'app/components/modal';
import { ServerCard } from 'app/[public]/[index]/components/server-card';

const CreateServerModalContent = lazy(async () => ({
  default: (await import('app/[public]/components/create-server-modal-content')).CreateServerModalContent,
}));

export const HomePage: React.FC = () => {
  const { isOpen: isCreateServerModalOpen, openModal: openCreateServerModal, closeModal: closeCreateServerModal } = useDialog();
  const { availableServers } = useAvailableServers();

  const resetDatabase = () => {
    const dbOpenDBRequest = indexedDB.deleteDatabase('echoes-of-travian');
    dbOpenDBRequest.onsuccess = () => {
      window.location.reload();
    };
  };

  return (
    <>
      <Head viewName="index" />
      <main className="flex flex-col">
        {/* Landing section */}
        <section className="container relative mx-auto flex min-h-[300px] flex-col gap-4 lg:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-4 p-4">
            <h1 className="text-3xl font-semibold dark:text-white">Echoes of Travian</h1>
            <h2 className="text-xl dark:text-white">
              Echoes of Travian is a single-player, real-time, browser-based strategy game, based on and inspired by Travian. It runs purely
              in the browser, requiring no downloads or installations.
            </h2>
            <Button onClick={() => openCreateServerModal()}>Create new server</Button>
            <p className="">
              Database schema is likely to change between builds. Make sure to always reset your local database after changing branches or
              trying a new build! Clicking on this button will delete &quot;echoes-of-travian&quot; database and refresh the page.
            </p>
            <Button
              onClick={resetDatabase}
              variant="danger"
            >
              Reset database
            </Button>
            <Modal
              isOpen={isCreateServerModalOpen}
              closeHandler={closeCreateServerModal}
              hasTitle
              title="Create new server"
            >
              <CreateServerModalContent />
            </Modal>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center">Something beautiful here</div>
        </section>
        {availableServers.length > 0 && (
          <section className="container mx-auto flex flex-col">
            <div className="scrollbar-hidden flex gap-4 overflow-x-scroll py-4">
              {availableServers.map((server: Server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
};
