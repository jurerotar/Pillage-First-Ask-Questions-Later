import { use } from 'react';
import { FaGithub } from 'react-icons/fa6';
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
              <Link to="/game-worlds/create">
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
              </Link>
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
          <TwitterSocialProofCard
            author="Orcdev"
            body="Here are some amazing open source projects I found: Pillage First Ask Questions Later by @jurerotar"
            href="https://x.com/orcdev/status/2026055804646723633"
          />
          <DiscordSocialProofCard
            author="hoangnguyen5639 on Discord"
            body="I love this game so much, waiting for any update!"
          />
          <DiscordSocialProofCard
            author="AllNineAliens on Discord"
            body="I'd just like to say, that I love this project! I've thought about making something similar time and time again! Last time I played Travian was in 2015, and I haven't been able to scratch that itch since."
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
          <DiscordSocialProofCard
            author="Joseph on Discord"
            body="I think the idea is genius and really fun."
          />
          <DiscordSocialProofCard
            author="Stellar on Discord"
            body="I've been dreaming of an offline version, and now it's finally in the making. Amazing!"
          />
          <DiscordSocialProofCard
            author="Foxplay on Discord"
            body="I'm so happy to get a chance playing this again with a few tweeks in quality of life, that make it so much better. Thank you very much, looking forward to this!"
          />
        </SocialProofMasonry>
      </div>
    </section>
  );
};

const principles = [
  {
    title: 'Play on your time',
    description:
      'We know life comes first. The game should work with your schedule, rewarding good planning instead of constant check-ins and perfectly timed logins.',
  },
  {
    title: 'No downloads, no accounts',
    description:
      'Open the game and start playing. No installation and no registration. Your game stays on your device, under your control.',
  },
  {
    title: 'No monetization hooks in the design',
    description:
      'No premium queues, no paid boosts and no mechanics that are worse on purpose until money is involved.',
  },
];

const MotivationSection = () => {
  return (
    <section className="pt-4 lg:pt-0">
      <div className="max-w-7xl min-h-75 p-2 mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="w-full mb-8 md:mb-0 order-2 flex items-center">
          <div className="w-full border-y border-border divide-y divide-border">
            {principles.map((principle, index) => (
              <div
                key={principle.title}
                className="grid grid-cols-[3rem_1fr] gap-3 py-4 md:grid-cols-[4rem_1fr] md:gap-5 md:py-6"
              >
                <Text
                  as="span"
                  className="font-mono text-3xl md:text-4xl leading-none text-foreground/40"
                >
                  0{index + 1}
                </Text>
                <div className="flex flex-col gap-2">
                  <Text
                    as="h3"
                    className="font-bold"
                  >
                    {principle.title}
                  </Text>
                  <Text className="text-foreground/80 text-sm leading-snug">
                    {principle.description}
                  </Text>
                </div>
              </div>
            ))}

            <div className="py-4 md:py-6">
              <Text className="max-w-xl text-lg font-medium leading-7">
                Built for the player who misses the long-form strategy loop, but
                not the obligation to live inside it.
              </Text>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full lg:my-20 gap-4 z-10 order-1">
          <Text
            as="h2"
            className="text-foreground"
          >
            Motivation behind Pillage First!
          </Text>

          <div className="prose text-foreground">
            <Motivation />
          </div>
          <DiscordButton>Help shape the game</DiscordButton>
        </div>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const questions = [
    {
      question:
        'Are there game design differences between Travian and Pillage First!?',
      answer:
        'Yes, there are a few! The main ones include new buildings, the removal of the capital village mechanic, expanded artifact system, planned new hero items and more NPC interactions. Mechanics are always up for discussion, so make sure to join our Discord server and share with us your thoughts!',
    },
    {
      question: 'Can I create more than one game world at a time?',
      answer:
        'Yes! You may create as many game worlds as you wish. You may also duplicate or export and share your game worlds with other players.',
    },
    {
      question: 'Why single player?',
      answer:
        'We want to provide each player with the ability to customize their own unique gameplay experience. This is not possible in a multiplayer environment.',
    },
    {
      question: 'Does the game continue even if I close the app?',
      answer:
        "Yes! You're free to close the app at any time and the game will pick off right next time you open it again! Units will continue to be trained, buildings will continue to be constructed and troops will continue to raid exactly as they would if you kept the app running.",
    },
    {
      question: 'Can game worlds be shared between devices?',
      answer:
        'Yes! You can do so by either manually exporting and re-importing game world file, or by using an automatic method, which is only possible to do with devices on the same network.',
    },
  ];

  return (
    <section className="py-8 lg:py-12">
      <div className="max-w-7xl p-2 mx-auto grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-8">
        <div className="flex flex-col gap-3">
          <Text as="h2">Frequently asked questions</Text>
          <Text>
            Short answers for the things people usually want to know before
            starting a world.
          </Text>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {questions.map((item) => (
            <details
              key={item.question}
              className="group py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-foreground">
                <Text
                  as="h3"
                  className="font-bold"
                >
                  {item.question}
                </Text>
                <span className="text-2xl leading-none transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <Text className="pt-3 pr-8">{item.answer}</Text>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

const OpenSourceSection = () => {
  return (
    <section className="bg-muted dark:bg-background overflow-hidden pt-4 lg:pt-0 -mb-4">
      <div className="max-w-7xl min-h-75 p-2 mx-auto grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col w-full lg:my-20 gap-4 z-10">
          <Text as="h2">Pillage First! is an open-source technology!</Text>

          <div>
            <OpenSource />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <GithubButton />
            <Link to="/get-involved">
              <Button variant="outline">Get involved</Button>
            </Link>
          </div>
        </div>

        <div className="w-full mt-16 relative">
          <FaGithub
            className="
              absolute -right-20 -top-60 md:-right-4 md:-top-8
              text-[#101411] dark:text-foreground
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
        <FAQSection />
        <OpenSourceSection />
      </main>
    </PageContents>
  );
};

export default HomePage;
