import { Link } from 'react-router';
import { Button } from 'app/components/ui/button';

const ErrorPage = () => {
  return (
    <>
      <title>403 | Pillage First!</title>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        403 - server exists, but it's already open
      </h1>
      <div className="h-1 w-16 bg-gray-200 rounded-full" />
      <p className="text-lg text-gray-900 mb-2">
        This server is already open in another tab or another browser.
      </p>
      <p className="text-gray-900 mb-6">
        To prevent data corruption, each server can only be accessed in one tab
        at a time. Please close the other tab and try to access the server from
        the homepage bellow.
      </p>

      <div className="flex justify-center gap-4">
        <Link to="/">
          <Button size="fit">Back to homepage</Button>
        </Link>
      </div>
    </>
  );
};

export default ErrorPage;
