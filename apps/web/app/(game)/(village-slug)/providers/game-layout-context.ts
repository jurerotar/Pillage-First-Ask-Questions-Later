import { createContext, type Dispatch, type SetStateAction } from 'react';

export type GameLayoutContextReturn = {
  areMobileDetailsVisible: boolean;
  setAreMobileDetailsVisible: Dispatch<SetStateAction<boolean>>;
};

export const GameLayoutContext = createContext<GameLayoutContextReturn>({
  areMobileDetailsVisible: true,
  setAreMobileDetailsVisible: () => {},
});
