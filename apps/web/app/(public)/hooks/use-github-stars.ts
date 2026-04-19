import { useQuery } from '@tanstack/react-query';

interface GithubRepo {
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
}

export const useGithubStars = (
  repo = 'jurerotar/Pillage-First-Ask-Questions-Later',
) => {
  return useQuery({
    queryKey: ['github-stars', repo],
    queryFn: async () => {
      const response = await fetch(`https://api.github.com/repos/${repo}`);

      if (!response.ok) {
        throw new Error('Failed to fetch github stars');
      }

      const data = (await response.json()) as GithubRepo;

      return {
        starCount: data.stargazers_count,
        forkCount: data.forks_count,
        watcherCount: data.watchers_count,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
