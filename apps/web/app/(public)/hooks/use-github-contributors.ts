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
      const response = await fetch('/github-contributors.json');

      if (!response.ok) {
        throw new Error('Failed to fetch github contributors');
      }

      const data = (await response.json()) as GithubContributor[];

      return data.filter((contributor) => contributor.type === 'User');
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
