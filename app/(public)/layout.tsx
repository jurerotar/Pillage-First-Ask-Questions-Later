import { Link, Outlet } from 'react-router';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
import { Tooltip } from 'app/components/tooltip';
import { env } from 'app/env';
import { Text } from 'app/components/text';

const PublicLayout = () => {
  return (
    <>
      <header className="">
        <div className="container mx-auto p-2 flex justify-between">
          <div className="" />
          <div className="flex gap-2">
            <a
              href="https://discord.gg/Ep7NKVXUZA"
              rel="noopener"
              className="flex items-center justify-center size-10 md:size-auto gap-2 rounded-full bg-[#7289da] shadow-md p-2 md:px-4"
            >
              <FaDiscord className="text-2xl md:text-3xl text-white" />
              <span className="hidden md:flex font-semibold text-white">
                Discord
              </span>
            </a>
            <a
              href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
              className="flex items-center justify-center size-10 md:size-auto gap-2 rounded-full bg-[#24292e] shadow-md p-2 md:px-4"
            >
              <FaGithub className="text-2xl md:text-3xl text-white" />
              <span className="hidden md:flex font-semibold text-white">
                GitHub
              </span>
            </a>
          </div>
        </div>
      </header>
      {/* biome-ignore lint/correctness/useUniqueElementIds: We need a stable id here, because it's referenced in other components */}
      <Tooltip id="public-tooltip" />
      <Outlet />
      <footer className="border-t mt-4">
        <div className="container mx-auto grid gap-4 md:gap-8 py-6 lg:py-10 md:grid-cols-4 px-2">
          <div className="space-y-2">
            <a
              href="/"
              className="font-semibold"
            >
              Pillage First! Ask Questions Later
            </a>
            <p className="text-muted-foreground">
              Pillage First! is an open-source, single-player strategy game
              inspired by Travian.'
            </p>
          </div>

          <nav className="space-y-2 hidden md:flex" />

          <nav className="space-y-2">
            <Text
              as="h3"
              className="font-medium"
            >
              Resources
            </Text>
            <Link
              className="underline"
              to="frequently-asked-questions"
            >
              Frequently asked questions
            </Link>
          </nav>

          <nav className="space-y-2">
            <Text
              as="h3"
              className="font-medium"
            >
              Social
            </Text>
            <div className="flex gap-2">
              <a
                href="https://discord.gg/Ep7NKVXUZA"
                rel="noopener"
                className="flex items-center justify-center gap-2 rounded-full bg-[#7289da] shadow-md p-2 px-4"
              >
                <FaDiscord className="text-2xl md:text-3xl text-white" />
                <span className="flex font-semibold text-white">Discord</span>
              </a>
              <a
                href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                className="flex items-center justify-center gap-2 rounded-full bg-[#24292e] shadow-md p-2 px-4"
              >
                <FaGithub className="text-2xl md:text-3xl text-white" />
                <span className="flex font-semibold text-white">GitHub</span>
              </a>
            </div>
          </nav>
        </div>

        <div className="border-t">
          <div className="container mx-auto flex flex-col gap-2 py-4 md:py-6 md:flex-row md:items-center md:justify-between px-2">
            <p className="text-xs text-muted-foreground">
              Not affiliated with Travian Games GmbH.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                App version: {env.VERSION}
              </p>
              <p className="text-xs text-muted-foreground">
                Commit ref: {env.COMMIT_REF}
              </p>
              <p className="text-xs text-muted-foreground">
                Branch: {env.HEAD}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default PublicLayout;
