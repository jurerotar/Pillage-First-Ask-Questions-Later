import { createContext } from 'react-router';

type SessionContext = {
  sessionId: string | null;
};

export const sessionContext = createContext<SessionContext>({
  sessionId: null,
});
