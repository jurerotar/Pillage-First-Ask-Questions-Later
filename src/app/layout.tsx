import React from 'react';
import { Outlet } from 'react-router-dom';
import { useEnvironment } from 'hooks/environment/use-environment';
import { useLocalStorage } from 'usehooks-ts';
import { Button } from 'components/buttons/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { CloseButton } from 'components/buttons/close-button';
import { SectionHeading } from 'components/section-heading';

const DevTools = () => {
  const [areDevToolsOpen, setAreDevToolsOpen] = useLocalStorage<boolean>('crylite-devtools', false);

  return (
    <>
      {/* DevTools open button */}
      {!areDevToolsOpen && (
        <Button
          className="fixed bottom-5 left-5 flex cursor-pointer items-center gap-2 bg-red-500"
          onClick={() => setAreDevToolsOpen(true)}
        >
          <span>Devtools</span>
          <FontAwesomeIcon icon={faGear} />
        </Button>
      )}
      {areDevToolsOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-gray-200">
          <div className="container mx-auto p-4">
            {/* Header */}
            <div className="relative mb-2 border-b border-gray-300 pb-2">
              <SectionHeading>
                Crylite Devtools
              </SectionHeading>
              <div className="absolute right-0 top-0">
                <CloseButton onClick={() => setAreDevToolsOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>

  );
};

export const AppLayout: React.FC = () => {
  const { environment } = useEnvironment();

  return (
    <>
      {environment === 'development' && (
        <DevTools />
      )}
      <Outlet />
    </>
  );
};
