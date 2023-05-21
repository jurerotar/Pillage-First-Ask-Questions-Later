import { useParams } from 'react-router-dom';

export const useServerId = () => {
  const { serverId } = useParams();

  return {
    serverId
  };
};
