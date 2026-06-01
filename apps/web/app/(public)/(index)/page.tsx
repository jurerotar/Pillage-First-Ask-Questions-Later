import { use } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCoins,
  FaComputer,
  FaGithub,
  FaGlobe,
  FaSliders,
  FaUser,
} from 'react-icons/fa6';
import { MdOutlineMobileFriendly } from 'react-icons/md';
import { Link } from 'react-router';
import { DiscordButton } from 'app/(public)/components/discord-button';
import { GithubButton } from 'app/(public)/components/github-button';
import {
  DiscordSocialProofCard,
  SocialProofMasonry,
  TwitterSocialProofCard,
} from 'app/(public)/components/social-proof';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { CookieContext } from 'app/providers/cookie-provider';
import screenshotsData from './assets/screenshots.json' with { type: 'json' };
import Landing from './mdx/landing.mdx';
import Motivation from './mdx/motivation.mdx';
import OpenSource from './mdx/open-source.mdx';

const screenshots = [
  {
    base: 'image-1',
    alt: 'Resources view',
  },
  {
    base: 'image-2',
    alt: 'Village view',
  },
  {
    base: 'image-3',
    alt: 'Map view',
  },
  {
    base: 'image-4',
    alt: 'Building view',
  },
  {
    base: 'image-5',
    alt: 'Resources details',
  },
];

const LandingScreenshotsSection = () => {
  const { uiColorScheme } = use(CookieContext);

  const { timestamp } = screenshotsData;

  return (
    <section className="bg-background pt-4 lg:pt-8">
      <div className="max-w-7xl px-2 mx-auto">
        <div className="flex flex-row overflow-x-auto lg:grid lg:grid-cols-5 gap-4 pb-4 lg:pb-0 scrollbar-hide snap-x snap-mandatory">
          {screenshots.map((screenshot) => (
            <div
              key={screenshot.base}
              className="min-w-60 lg:min-w-0 snap-center"
            >
              <picture>
                <source
                  srcSet={`/landing/${screenshot.base}-${uiColorScheme}-${timestamp}.avif`}
                  type="image/avif"
                />
                <img
                  src={`/landing/${screenshot.base}-${uiColorScheme}-${timestamp}.jpg`}
                  alt={screenshot.alt}
                  className="rounded-lg border border-border w-full h-auto"
                  loading="lazy"
                />
              </picture>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  return (
    <section className="bg-background py-8 lg:py-12">
      <div className="max-w-7xl px-2 mx-auto flex flex-col items-center gap-2">
        <Text
          as="h2"
          className="text-center"
        >
          Ready to pillage?
        </Text>
        <Text className="text-center mb-2">
          Create your first game world bellow, or continue playing on your
          existing worlds.
        </Text>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link to="/game-worlds/create">
            <Button>Create new world</Button>
          </Link>
          <Link to="/game-worlds">
            <Button variant="outline">Your game worlds</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

const SocialProofSection = () => {
  return (
    <section className="bg-background pt-8 lg:pt-12">
      <div className="max-w-7xl px-2 mx-auto grid grid-cols-1 gap-6 lg:gap-10">
        <div className="flex flex-col gap-3">
          <Text as="h2">Built with strategy players in the loop</Text>
          <Text variant="muted">
            Feedback from Discord and X helps shape balance, usability and the
            parts of classic browser strategy games worth preserving.
          </Text>
          <div className="flex flex-wrap gap-2">
            <DiscordButton>Join the Discord</DiscordButton>
            <GithubButton />
            {/*<a*/}
            {/*  rel="noopener noreferrer"*/}
            {/*  target="_blank"*/}
            {/*  href="https://x.com/pillagefirst"*/}
            {/*  className="inline-flex w-fit"*/}
            {/*>*/}
            {/*  <Button*/}
            {/*    variant="outline"*/}
            {/*    className="inline-flex items-center gap-2"*/}
            {/*  >*/}
            {/*    <FaXTwitter className="size-4" />*/}
            {/*    Follow on X*/}
            {/*  </Button>*/}
            {/*</a>*/}
          </div>
        </div>

        <SocialProofMasonry>
          <DiscordSocialProofCard
            author="Laarva on Discord"
            body="Very excited for new updates. Really loving what I've seen so far I have been wanting an offline game like this forever. Keep up the good work!"
          />
          <DiscordSocialProofCard
            author="hoangnguyen5639 on Discord"
            body="I love this game so much, waiting for any update!"
          />
          <DiscordSocialProofCard
            author="AllNineAliens on Discord"
            body="I'd just like to say, that I love this project! I've thought about making something similar time and time again! Last time I played Travian was in 2015, and I haven't been able to scratch that itch since."
          />
          <TwitterSocialProofCard
            author="Orcdev"
            body="Here are some amazing open source projects I found: Pillage First Ask Questions Later by @jurerotar"
            href="https://x.com/orcdev/status/2026055804646723633"
          />
          <DiscordSocialProofCard
            author="Neme on Discord"
            body="I love the idea of this project. I was actually missing this kind of game as my work hours do not really allow me to 24/7 Travian anymore."
          />
          <DiscordSocialProofCard
            author="Ekklo on Discord"
            body="Love your work dude! Keep it up!"
          />
          <DiscordSocialProofCard
            author="Petrey on Discord"
            body="Awesome project I can say. I have just discoverd it and start to test it. I can't imagine how big complexity must be on the backend. But fingers cross, that development will still continue!"
          />
          <DiscordSocialProofCard
            author="Cheese on Discord"
            body="The game is awesome. I study almost 11 hours a day and I really needed something to play in my 15 minute breaks."
          />
        </SocialProofMasonry>
      </div>
    </section>
  );
};

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
      title: t('Mobile first'),
      icon: MdOutlineMobileFriendly,
      description: t('We strive for a great experience on any device.'),
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
          <DiscordButton>Help shape the game</DiscordButton>
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
          <Text
            as="h2"
            className="text-[#391600] dark:text-foreground"
          >
            Pillage First! is an open-source technology!
          </Text>

          <div className="text-[#391600] dark:text-foreground">
            <OpenSource />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <GithubButton />
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
    <PageContents>
      <title>Pillage First! (Ask Questions Later)</title>
      <main>
        <div className="max-w-7xl mx-auto flex py-8 lg:py-12 lg:-mt-6 flex-col lg:flex-row gap-2 px-2 justify-center items-center">
          <section className="flex flex-col flex-1 gap-4 justify-center">
            <Text
              as="h1"
              className="text-xl sm:text-2xl"
            >
              <b>Pillage First! (Ask Questions Later)</b>
            </Text>

            <Landing />

            <div className="flex flex-wrap gap-2">
              <Link to="/game-worlds/create">
                <Button>Create new world</Button>
              </Link>
              <Link to="/game-worlds">
                <Button variant="outline">Your game worlds</Button>
              </Link>
              <DiscordButton />
            </div>
          </section>
        </div>
        <LandingScreenshotsSection />
        <SocialProofSection />
        <CTASection />
        <MotivationSection />
        <OpenSourceSection />
      </main>
    </PageContents>
  );
};

export default HomePage;
