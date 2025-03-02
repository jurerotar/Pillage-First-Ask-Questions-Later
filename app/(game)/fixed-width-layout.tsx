import { Outlet } from 'react-router';
import { Backlink } from 'app/(game)/components/backlink';

const FixedWidthLayout = () => {
  return (
    <main className="mt-2 md:mt-24 mx-auto max-w-2xl px-2 lg:px-0 mb-14 lg:mb-0">
      <div className="flex flex-col gap-2">
        <Backlink />
        <Outlet />
      </div>
    </main>
  );
};

export default FixedWidthLayout;
