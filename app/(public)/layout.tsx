import { Outlet } from 'react-router';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
import i18n from 'i18next';

export const clientLoader = async () => {
  const publicResources = await import('app/locales/en-US/public.json');

  i18n.addResourceBundle('en-US', 'public', publicResources);
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
              <FaDiscord className="text-2xl md:text-3xl text-white" />
              <span className="hidden md:flex font-semibold text-white">Discord</span>
            </a>
            <a
              href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
              className="flex items-center justify-center size-10 md:size-auto gap-2 rounded-full bg-[#24292e] shadow-md p-2 md:px-4"
            >
              <FaGithub className="text-2xl md:text-3xl text-white" />
              <span className="hidden md:flex font-semibold text-white">GitHub</span>
            </a>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
};

export default PublicLayout;
