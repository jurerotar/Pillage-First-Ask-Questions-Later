import { FaGithub, FaStar } from 'react-icons/fa6';
import { Button } from 'app/components/ui/button';
import { useGithubStars } from 'app/hooks/use-github-stars';

type GithubButtonProps = {
  className?: string;
  showStarCount?: boolean;
};

export const GithubButton = ({
  className,
  showStarCount = true,
}: GithubButtonProps) => {
  const { data: githubData } = useGithubStars();

  return (
    <a
      rel="noopener noreferrer"
      href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
      target="_blank"
      className={className}
    >
      <Button className="flex items-center gap-2">
        <FaGithub className="size-4" />
        GitHub
        {showStarCount && githubData?.starCount !== undefined && (
          <span className="flex items-center gap-1 bg-[#391600]/10 dark:bg-foreground/10 px-1.5 py-0.5 rounded-md text-xs font-medium">
            <FaStar className="size-3" />
            {githubData.starCount}
          </span>
        )}
      </Button>
    </a>
  );
};
