import { useGithubContributors } from 'app/(public)/hooks/use-github-contributors';

export const GithubContributorsPreview = () => {
  const { data: contributors, isError, isLoading } = useGithubContributors();

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Loading placeholders have no stable identity.
            key={index}
            className="size-10 animate-pulse rounded-full bg-muted"
          />
        ))}
      </>
    );
  }

  if (isError) {
    return null;
  }

  return (
    <>
      {contributors?.map((contributor) => (
        <a
          key={contributor.id}
          rel="noopener noreferrer"
          target="_blank"
          href={contributor.html_url}
          title={`${contributor.login} - ${contributor.contributions} contributions`}
          className="rounded-full outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src={contributor.avatar_url}
            alt={`${contributor.login} GitHub avatar`}
            className="size-10 rounded-full border border-border bg-muted"
            loading="lazy"
          />
        </a>
      ))}
    </>
  );
};
