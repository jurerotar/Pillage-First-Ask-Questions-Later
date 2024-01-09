import React, { lazy } from 'react';
import { Server } from 'interfaces/models/game/server';
import { Button } from 'app/components/buttons/button';
import { Paragraph } from 'app/components/paragraph';
import { Head } from 'app/components/head';
import { useAvailableServers } from 'app/[public]/hooks/use-available-servers';
import { useDialog } from 'app/hooks/use-dialog';
import { Modal } from 'app/components/modal';
import { ServerCard } from 'app/[public]/[index]/components/server-card';

const CreateServerModalContent = lazy(async () => ({
  default: (await import('app/[public]/components/create-server-modal-content')).CreateServerModalContent,
}));

export const HomePage: React.FC = () => {
  const { isOpen: isCreateServerModalOpen, openModal: openCreateServerModal, closeModal: closeCreateServerModal } = useDialog();
  const { availableServers } = useAvailableServers();

  return (
    <>
      <Head viewName="index" />
      <main className="flex flex-col">
        {/* Landing section */}
        <section className="container relative mx-auto flex h-[calc(100vh-4rem-200px)] min-h-[600px] flex-col gap-4 lg:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-2 p-4">
            <h1 className="text-3xl font-semibold dark:text-white">Echoes of Travian</h1>
            <h2 className="text-xl dark:text-white">Lorem ipsum dolor sit amet, consectetur adipisicing elit.</h2>
            <Paragraph>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid assumenda, blanditiis consequatur, culpa dolorem doloremque
              dolorum ea, et excepturi exercitationem facere iure mollitia nihil officia quas sunt unde velit voluptate.
            </Paragraph>
            <Button onClick={() => openCreateServerModal()}>Create new server</Button>
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
        <section className="container mx-auto flex flex-col gap-4">
          <h2>Active servers</h2>
          <div className="flex gap-4 overflow-x-scroll">
            {availableServers.map((server: Server) => (
              <ServerCard
                key={server.id}
                server={server}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  );
};