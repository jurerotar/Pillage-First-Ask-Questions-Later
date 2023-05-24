import { useParams } from 'react-router-dom';

export const useServerName = () => {
  const { serverName } = useParams();

  return {
    serverName: serverName as string
  };
};
