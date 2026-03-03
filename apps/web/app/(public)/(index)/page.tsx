import { useTranslation } from 'react-i18next';
import {
  FaCodeMerge,
  FaCoins,
  FaComputer,
  FaGithub,
  FaGlobe,
  FaRegLightbulb,
  FaSliders,
  FaUser,
} from 'react-icons/fa6';
import { Link } from 'react-router';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import Landing from './mdx/landing.mdx';
import Motivation from './mdx/motivation.mdx';
import OpenSource from './mdx/open-source.mdx';

const MotivationSection = () => {
  const { t } = useTranslation('public');

  const goals = [
    {
      title: t('Offline'),
      icon: FaGlobe,
      description: t('Play anywhere, anytime, without an internet connection.'),
    },
    {
      title: t('Single player'),
      icon: FaUser,
      description: t('No pressure from other players. Play at your own pace.'),
    },
    {
      title: t('Accessible'),
      icon: FaComputer,
      description: t(
        'Modern web technologies ensuring the game runs on any device.',
      ),
    },
    {
      title: t('Nicer UX'),
      icon: FaRegLightbulb,
      description: t('Quality-of-life features and a clean, modern interface.'),
    },
    {
      title: t('No pay to win'),
      icon: FaCoins,
      description: t(
        'No game mechanics to incentivize spending real-world money.',
      ),
    },
    {
      title: t('Customizable'),
      icon: FaSliders,
      description: t(
        'Fine-tune your experience with a variety of settings and options.',
      ),
    },
  ];

  return (
    <section className="bg-linear-to-b from-background to-[#F5A911] dark:to-[#8B5E00] pt-4 lg:pt-0">
      <div className="max-w-7xl min-h-75 p-2 mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="w-full mb-8 md:mb-0 order-2 md:order-1 flex justify-center items-center">
          <div className="grid grid-cols-2 gap-4 w-full">
            {goals.map((goal) => (
              <div
                key={goal.title}
                className="bg-card/50 backdrop-blur-sm p-2 rounded-md shadow-sm border border-border flex flex-col gap-3 transition-transform hover:scale-105"
              >
                <div className="p-2 md:p-3 bg-card rounded-md w-fit shadow-xs">
                  <goal.icon className="text-[#391600] dark:text-foreground size-4 md:size-6" />
                </div>
                <Text
                  as="h3"
                  className="text-[#391600] dark:text-foreground font-bold"
                >
                  {goal.title}
                </Text>
                <Text className="text-[#391600]/80 dark:text-foreground/80 text-sm leading-snug">
                  {goal.description}
                </Text>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col w-full lg:my-20 gap-4 z-10 order-1 md:order-2">
          <Text
            as="h2"
            className="text-[#391600] dark:text-foreground"
          >
            Motivation behind Pillage First!
          </Text>

          <div className="prose text-[#391600] dark:text-foreground">
            <Motivation />
          </div>
          <Link
            rel="noopener noreferrer"
            target="_blank"
            to="https://discord.gg/Ep7NKVXUZA"
          >
            <Button>Join our community on Discord</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

const OpenSourceSection = () => {
  return (
    <section className="bg-linear-to-t from-[#FFE345] via-[#FFD24A] to-[#F5A911] dark:from-[#9A8400] dark:via-[#8B7400] dark:to-[#8B5E00] overflow-hidden pt-4 lg:pt-0 -mb-4">
      <div className="max-w-7xl min-h-75 p-2 mx-auto grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col w-full lg:my-20 gap-4 z-10">
          <div className="inline-flex justify-center items-center w-fit p-4 bg-card rounded-full">
            <FaCodeMerge className="text-[#391600] dark:text-foreground size-6" />
          </div>
          <Text
            as="h2"
            className="text-[#391600] dark:text-foreground"
          >
            Pillage First! is an open-source technology!
          </Text>

          <div className="text-[#391600] dark:text-foreground">
            <OpenSource />
          </div>

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
              text-[#391600] dark:text-foreground
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
        <MotivationSection />
        <OpenSourceSection />
      </main>
    </>
  );
};

export default HomePage;
