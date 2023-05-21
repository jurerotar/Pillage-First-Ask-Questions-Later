import React, { Suspense } from 'react';
import { Await, Outlet } from 'react-router-dom';
// import { GameProvider } from 'providers/game/game-context';
// import { VillageProvider } from 'providers/game/village-context';
// import { HeroProvider } from 'providers/game/hero-context';
// import { GameLayout } from 'layouts/game/game-layout';
import { useServerId } from 'hooks/game/use-server-id';

export const loadGameData = async () => {

};

export const GameProviders: React.FC = () => {
  const { serverId } = useServerId();

  console.log(serverId);

  return (
    <Suspense fallback={<>Suspense</>}>
      <Await
        errorElement={<>Error</>}
        resolve={[]}
      >
        <Outlet />
      </Await>
    </Suspense>
  );

  // return (
  //   <GameProvider server={serverData}>
  //     <VillageProvider>
  //       <HeroProvider>
  //         <GameLayout>
  //           <Outlet />
  //         </GameLayout>
  //       </HeroProvider>
  //     </VillageProvider>
  //   </GameProvider>
  // );
};
