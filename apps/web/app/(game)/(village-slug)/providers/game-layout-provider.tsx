import { type PropsWithChildren, useState } from 'react';
import { GameLayoutContext } from 'app/(game)/(village-slug)/providers/game-layout-context';

export const GameLayoutProvider = ({ children }: PropsWithChildren) => {
  const [areMobileDetailsVisible, setAreMobileDetailsVisible] =
    useState<boolean>(true);

  return (
    <GameLayoutContext
      value={{
        areMobileDetailsVisible,
        setAreMobileDetailsVisible,
      }}
    >
      {children}
    </GameLayoutContext>
  );
};
