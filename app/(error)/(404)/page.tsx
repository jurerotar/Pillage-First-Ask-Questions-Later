import { Link } from 'react-router';
import { Button } from 'app/components/ui/button';

const ErrorPage = () => {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        403 - server cannot be found
      </h1>
      <div className="h-1 w-16 bg-gray-200 rounded-full" />
      <p className="text-lg text-gray-900 mb-2">This server does not exist.</p>
      <p className="text-gray-900 mb-6">
        We couldn’t find any saved data for the server you're trying to access.
        It may have been deleted or never initialized. You can select from a
        list of servers on homepage or create new server bellow.
      </p>

      <div className="flex justify-center gap-4">
        <Link to="/">
          <Button>Back to homepage</Button>
        </Link>
        <Link to="/create-new-server">
          <Button>Create new server</Button>
        </Link>
      </div>
    </>
  );
};

export default ErrorPage;
