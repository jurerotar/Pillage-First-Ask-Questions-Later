import React from 'react';
import { Server } from 'interfaces/models/game/server';
import { Button } from 'components/common/buttons/button';
import { Paragraph } from 'components/common/paragraph';
import { Head } from 'components/common/head';
import { useContextSelector } from 'use-context-selector';
import { ModalContext } from 'providers/global/modal-context';
import { CreateServerModalContent } from 'components/modal-content/public/create-server-modal-content';
import { ServerCard } from 'components/public/home-view/server-card';
import { useAvailableServers } from 'hooks/use-available-servers';

export const HomeView: React.FC = () => {
  const openModal = useContextSelector(ModalContext, (v) => v.openModal);

  const { availableServers } = useAvailableServers();

  return (
    <>
      <Head viewName="home" />
      <main className="flex flex-col">
        {/* Landing section */}
        <section className="container relative mx-auto flex h-[calc(100vh-4rem-200px)] min-h-[600px] flex-col gap-4 lg:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-2 p-4">
            <h1 className="duration-default text-3xl font-semibold transition-colors dark:text-white">
              Crylite
            </h1>
            <h2 className="duration-default text-xl transition-colors dark:text-white">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            </h2>
            <Paragraph>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid assumenda, blanditiis consequatur, culpa dolorem doloremque
              dolorum ea, et excepturi exercitationem facere iure mollitia nihil officia quas sunt unde velit voluptate.
            </Paragraph>
            <Button
              onClick={() => openModal((
                <CreateServerModalContent />
              ))}
            >
              Create new server
            </Button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center">
            Something beautiful here
          </div>
        </section>
        <section className="container mx-auto flex flex-col gap-4">
          <h2>
            Active servers
          </h2>
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
