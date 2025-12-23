import type { Route } from '.react-router/types/app/+types/root';

export const clientSessionMiddleware: Route.ClientMiddlewareFunction = async ({
  context,
}) => {
  const { sessionContext } = await import('app/context/session');

  const sessionCtx = context.get(sessionContext);
  if (!sessionCtx.sessionId) {
    sessionCtx.sessionId = window.crypto.randomUUID();
  }
};
