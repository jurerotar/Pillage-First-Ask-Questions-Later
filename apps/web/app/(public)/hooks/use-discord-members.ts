import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

const discordMembersSchema = z.object({
  memberCount: z.number().int().nonnegative(),
});

export const useDiscordMembers = () => {
  return useQuery({
    queryKey: ['discord-members'],
    queryFn: async () => {
      const response = await fetch('/api/discord-members?code=Ep7NKVXUZA');

      if (!response.ok) {
        throw new Error('Failed to fetch discord members');
      }

      return discordMembersSchema.parse(await response.json());
    },
    placeholderData: {
      memberCount: 364,
    },
  });
};
