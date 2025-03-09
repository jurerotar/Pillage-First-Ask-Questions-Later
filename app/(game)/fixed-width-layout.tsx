import { Outlet } from 'react-router';
import { Backlink } from 'app/(game)/components/backlink';

const FixedWidthLayout = () => {
  return (
    <main className="lg:mt-12 mx-auto max-w-2xl px-2 lg:px-0 mb-16.5 lg:mb-0">
      <div className="flex flex-col gap-2">
        <Backlink />
        <Outlet />
      </div>
    </main>
  );
};

export default FixedWidthLayout;
