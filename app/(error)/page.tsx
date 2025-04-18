import { useSearchParams } from 'react-router';

const ErrorPage = () => {
  const [searchParams] = useSearchParams();
  const errorId = searchParams.get('error-id');

  return (
    <p>Error, error-id: {errorId}</p>
  );
};

export default ErrorPage;
