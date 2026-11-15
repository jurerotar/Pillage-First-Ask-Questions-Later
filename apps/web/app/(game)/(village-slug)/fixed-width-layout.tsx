import { Outlet } from 'react-router';

const FixedWidthLayout = () => {
  return (
    <main className="mt-2 lg:mt-20 mx-auto max-w-xl lg:max-w-xl px-safe mb-safe-offset-40 lg:mb-0 lg:px-0">
      <div className="flex flex-col gap-4 p-2 bg-card lg:border lg:border-border relative transition-colors">
        <Outlet />
      </div>
    </main>
  );
};

export default FixedWidthLayout;
