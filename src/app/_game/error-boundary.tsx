import React from 'react';
import { useRouteError } from 'react-router-dom';

export const GameErrorBoundary = () => {
  const error = useRouteError();
  const { name, message } = error as Error;

  return (
    <>
      <h1>{name}</h1>
      <p>{message}</p>
    </>
  );
};
