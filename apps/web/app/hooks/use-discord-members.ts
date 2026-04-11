import { useQuery } from '@tanstack/react-query';

export const useDiscordMembers = () => {
  return useQuery({
    queryKey: ['discord-members'],
    queryFn: async () => {
      const response = await fetch(`/api/discord-members?code=Ep7NKVXUZA`);

      const data = await response.json();

      return data;
    },
    placeholderData: {
      memberCount: 217,
    },
  });
};
