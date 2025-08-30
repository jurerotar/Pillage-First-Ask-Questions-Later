import { Outlet } from 'react-router';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
import { loadPublicTranslations } from 'app/localization/loaders/public';
import { Tooltip } from 'app/components/tooltip';
import { Icon } from 'react-icons-sprite';

export const clientLoader = async () => {
  // const locale = await getCookie('locale', 'en-US');
  const locale = 'en-US';

  await loadPublicTranslations(locale);
};

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
              <Icon
                icon={FaDiscord}
                className="text-2xl md:text-3xl text-white"
              />
              <span className="hidden md:flex font-semibold text-white">
                Discord
              </span>
            </a>
            <a
              href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
              className="flex items-center justify-center size-10 md:size-auto gap-2 rounded-full bg-[#24292e] shadow-md p-2 md:px-4"
            >
              <Icon
                icon={FaGithub}
                className="text-2xl md:text-3xl text-white"
              />
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
    </>
  );
};

export default PublicLayout;
