import { Outlet } from 'react-router';
import { Backlink } from 'app/(game)/(village-slug)/components/backlink';

const FixedWidthLayout = () => {
  return (
    <main className="mt-2 lg:mt-20 mx-auto max-w-2xl px-2 lg:px-0 mb-26 lg:mb-0">
      <div className="flex flex-col gap-4">
        <Backlink />
        <Outlet />
      </div>
    </main>
  );
};

export default FixedWidthLayout;
