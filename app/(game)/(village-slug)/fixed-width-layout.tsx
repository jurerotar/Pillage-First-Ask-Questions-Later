import { Outlet } from 'react-router';

const FixedWidthLayout = () => {
  return (
    <main className="mt-2 lg:mt-20 mx-auto max-w-2xl px-2 lg:px-0 mb-26 lg:mb-0">
      <div className="flex flex-col gap-4 p-2 bg-white">
        <Outlet />
      </div>
    </main>
  );
};

export default FixedWidthLayout;
