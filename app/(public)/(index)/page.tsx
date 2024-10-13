import { ServerCard } from 'app/(public)/(index)/components/server-card';
import { Button } from 'app/components/buttons/button';
import { Modal } from 'app/components/modal';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import { useDialog } from 'app/hooks/use-dialog';
import type { Server } from 'app/interfaces/models/game/server';
import { isInDevelopmentMode } from 'app/utils/common';
import type React from 'react';
import { lazy } from 'react';

const CreateServerModalContent = lazy(async () => ({
  default: (await import('app/(public)/components/create-server-modal-content')).CreateServerModalContent,
}));

const HomePage: React.FC = () => {
  const { isOpen: isCreateServerModalOpen, openModal: openCreateServerModal, closeModal: closeCreateServerModal } = useDialog();
  const { availableServers } = useAvailableServers();

  const resetOpfs = async () => {
    await (await navigator.storage.getDirectory()).removeEntry('pillage-first-ask-questions-later', { recursive: true });
    window.location.reload();
  };

  return (
    <>
      <main className="flex flex-col">
        {/* Landing section */}
        <section className="container relative mx-auto flex min-h-[300px] flex-col gap-4 lg:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-4 p-4">
            <h1 className="text-3xl font-semibold dark:text-white">Pillage First! (Ask Questions Later)</h1>
            <h2 className="text-xl dark:text-white">
              Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage
              resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions
              later! ⚔🔥
            </h2>
            <Button onClick={() => openCreateServerModal()}>Create new server</Button>

            {isInDevelopmentMode() && (
              <>
                <p className="">In case of errors, or unexpected data persisting in your OPFS, this button resets OPFS.</p>
                <Button
                  onClick={resetOpfs}
                  variant="danger"
                >
                  Delete all saved data
                </Button>
              </>
            )}
            <Modal
              isOpen={isCreateServerModalOpen}
              closeHandler={closeCreateServerModal}
              hasTitle
              title="Create new server"
            >
              <CreateServerModalContent />
            </Modal>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center" />
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

export default HomePage;
