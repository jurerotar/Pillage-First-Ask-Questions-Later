import { FaCodeMerge, FaGithub } from 'react-icons/fa6';
import { Link } from 'react-router';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import Landing from './mdx/landing.mdx';
import OpenSource from './mdx/open-source.mdx';

const OpenSourceSection = () => {
  return (
    <section className="bg-linear-to-t from-[#F5A911] via-[#FFD24A] to-[#FFE345] overflow-hidden pt-4 lg:pt-0 -mb-4">
      <div className="max-w-7xl min-h-75 p-4 mx-auto grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col w-full lg:my-20 gap-4 z-10">
          <div className="inline-flex justify-center items-center w-fit p-4 bg-white rounded-full">
            <FaCodeMerge className="text-[#391600] size-6" />
          </div>
          <Text
            as="h2"
            className="text-[#391600]"
          >
            Pillage First! is an open-source technology!
          </Text>

          <OpenSource />

          <div className="flex gap-2">
            <a
              rel="noopener noreferrer"
              href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
              target="_blank"
            >
              <Button>GitHub</Button>
            </a>
            <Link to="/get-involved">
              <Button variant="secondary">Get involved</Button>
            </Link>
          </div>
        </div>

        <div className="w-full mt-16 relative">
          <FaGithub
            className="
              absolute -right-20 -top-60 md:-right-4 md:-top-8
              text-[#391600]
              opacity-40 md:opacity-80
              size-80 md:size-100 lg:size-120
            "
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
};

const HomePage = () => {
  return (
    <>
      <title>Pillage First! (Ask Questions Later)</title>
      <main>
        <div className="max-w-7xl mx-auto flex min-h-112.5 lg:-mt-6 flex-col lg:flex-row gap-2 px-2 justify-center items-center">
          <section className="flex flex-col flex-1 gap-4 justify-center">
            <Text
              as="h1"
              className="text-xl sm:text-2xl"
            >
              <b>Pillage First! (Ask Questions Later)</b>
            </Text>

            <Landing />

            <div className="flex gap-2">
              <Link to="/game-worlds/create">
                <Button>Try now</Button>
              </Link>
              <Link to="/game-worlds">
                <Button variant="outline">Existing game worlds</Button>
              </Link>
            </div>
          </section>
          <section className="flex flex-1" />
        </div>
        <OpenSourceSection />
      </main>
    </>
  );
};

export default HomePage;
