import React from 'react';
import { Outlet } from 'react-router-dom';

const DefaultLayout: React.FC = (): JSX.Element => {
  return (
    <>
      <nav className="w-full flex bg-blue-500">
        <div className="container mx-auto p-4">
          Navigacija
        </div>
      </nav>
      <Outlet />
      <footer className="w-full flex bg-blue-500">
        <div className="container mx-auto p-4">
          Footer
        </div>
      </footer>
    </>
  );
};

export default DefaultLayout;
