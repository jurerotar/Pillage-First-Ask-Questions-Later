import { Outlet } from 'react-router';

const FixedWidthLayout = () => {
  return (
    <main className="lg:mt-20 mx-auto max-w-2xl mb-26 lg:mb-0">
      <div className="flex flex-col gap-4 p-2 bg-card lg:border lg:border-border">
        <Outlet />
      </div>
    </main>
  );
};

export default FixedWidthLayout;
