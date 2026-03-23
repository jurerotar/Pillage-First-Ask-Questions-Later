import { FaDiscord, FaUsers } from 'react-icons/fa6';
import { Button } from 'app/components/ui/button';
import { useDiscordMembers } from 'app/hooks/use-discord-members';

type DiscordButtonProps = {
  showMemberCount?: boolean;
};

export const DiscordButton = ({
  showMemberCount = true,
}: DiscordButtonProps) => {
  const { data: discordData } = useDiscordMembers();

  return (
    <a
      rel="noopener noreferrer"
      target="_blank"
      href="https://discord.gg/Ep7NKVXUZA"
      className="inline-flex w-fit"
    >
      <Button
        className="inline-flex items-center gap-2"
        variant="discord"
      >
        <FaDiscord className="size-6" />
        <span className="inline-flex items-center gap-2">
          <span>Join the community</span>
          {showMemberCount && discordData?.memberCount !== undefined && (
            <span className="inline-flex items-center gap-2">
              <FaUsers className="size-4" />
              {discordData.memberCount}
            </span>
          )}
        </span>
      </Button>
    </a>
  );
};
