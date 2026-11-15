import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

const githubRepoSchema = z.object({
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
  watchers_count: z.number().int().nonnegative(),
});

export const useGithubStars = () => {
  return useQuery({
    queryKey: ['github-stars'],
    queryFn: async () => {
      const response = await fetch('/github-repository.json');

      if (!response.ok) {
        throw new Error('Failed to fetch github stars');
      }

      const data = githubRepoSchema.parse(await response.json());

      return {
        starCount: data.stargazers_count,
        forkCount: data.forks_count,
        watcherCount: data.watchers_count,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
