import { useRouteError } from 'react-router';

export default function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Error Loading Player</h1>
      <p>
        {error instanceof Error
          ? error.message
          : 'An error occurred while loading the player data'}
      </p>
    </div>
  );
}
