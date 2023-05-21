import React from 'react';
import { useLocation } from 'react-router-dom';

export const TestView: React.FC = () => {
  const location = useLocation();
  return (
    <>
      Test page {location.pathname}
    </>
  );
};
