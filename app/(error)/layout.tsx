import { Outlet } from 'react-router';
import { FaExclamationCircle } from 'react-icons/fa';

const ErrorLayout = () => {
  return (
    <main>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-background rounded-xl shadow-lg p-8 animate-fade-in">
          <div className="flex flex-col items-center text-center gap-2">
            <FaExclamationCircle className="text-yellow-300 text-[5rem]" />
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  );
};

export default ErrorLayout;
