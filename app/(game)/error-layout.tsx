import { Skeleton } from 'app/components/ui/skeleton';
import { Outlet } from 'react-router';

const ErrorLayout = () => {
  return (
    <>
      <div className="h-dvh w-full flex flex-col justify-between gap-2 lg:hidden">
        <div className="flex flex-col p-2 pt-0 bg-linear-to-r from-gray-200 via-white to-gray-200">
          <div className="flex gap-6 w-full h-14 items-center">
            <Skeleton className="size-11.5 rounded-full!" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="size-11.5 rounded-full!" />
          </div>
          <Skeleton className="h-13" />
        </div>
        <Outlet />
        <Skeleton className="h-24 rounded-none!" />
      </div>
      <div className="hidden lg:flex flex-col justify-center relative">
        <Skeleton className="h-19 w-full rounded-none!" />
        <Skeleton className="h-16 w-144 mx-auto rounded-none! absolute top-27 absolute-centering" />
        <div className="mt-20">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default ErrorLayout;
