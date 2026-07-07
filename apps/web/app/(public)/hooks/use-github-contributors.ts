import { useQuery } from '@tanstack/react-query';

type GithubContributor = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
};

export const useGithubContributors = () => {
  return useQuery({
    queryKey: ['github-contributors'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.github.com/repos/jurerotar/Pillage-First-Ask-Questions-Later/contributors?per_page=12',
      );

      if (!response.ok) {
        throw new Error('Failed to fetch github contributors');
      }

      const data = (await response.json()) as GithubContributor[];

      return data.filter((contributor) => contributor.type === 'User');
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
