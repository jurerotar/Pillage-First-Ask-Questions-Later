import { useQuery } from '@tanstack/react-query';

type DiscordInvite = {
  approximate_member_count: number;
};

export const useDiscordMembers = (inviteCode = 'Ep7NKVXUZA') => {
  return useQuery({
    queryKey: ['discord-members', inviteCode],
    queryFn: async () => {
      const response = await fetch(
        `https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`,
      );

      const data = (await response.json()) as DiscordInvite;

      return {
        memberCount: data.approximate_member_count,
      };
    },
    placeholderData: {
      memberCount: 200,
    },
  });
};
