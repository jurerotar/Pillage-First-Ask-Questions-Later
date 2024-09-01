import { CurrentResourceProvider } from 'app/[game]/providers/current-resources-provider';
import { GameEngineProvider } from 'app/[game]/providers/game-engine-provider';
import { GameStateProvider } from 'app/[game]/providers/game-state-provider';
import { Outlet } from 'react-router-dom';

export const GameProviders = () => {
  return (
    <GameStateProvider>
      <GameEngineProvider>
        <CurrentResourceProvider>
          <Outlet />
        </CurrentResourceProvider>
      </GameEngineProvider>
    </GameStateProvider>
  );
};
