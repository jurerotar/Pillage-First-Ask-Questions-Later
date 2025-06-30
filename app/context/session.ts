import { unstable_createContext } from 'react-router';

type SessionContext = {
  sessionId: string | null;
};

export const sessionContext = unstable_createContext<SessionContext>({
  sessionId: null,
});
