import { type ReactNode, use } from 'react';
import { Link } from 'react-router';
import { Text } from 'app/components/text';
import { CookieContext } from 'app/providers/cookie-context';
import screenshotsData from '../(index)/assets/screenshots.json' with {
  type: 'json',
};

type WikiPageContentProps = {
  page: WikiPage;
};

export interface WikiPage {
  slug: string;
  title: string;
  summary: string;
  Content: (props: WikiPageContentProps) => ReactNode;
}

const WikiArticle = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <article className="flex flex-col gap-6">
      <Text
        as="h1"
        className="text-3xl font-medium leading-tight lg:text-5xl"
      >
        {title}
      </Text>
      {children}
    </article>
  );
};

const WikiSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <section className="flex flex-col gap-3">
      <Text
        as="h2"
        className="scroll-mt-24"
        id={title.toLowerCase().replaceAll(' ', '-')}
      >
        {title}
      </Text>
      {children}
    </section>
  );
};

const WikiList = ({ children }: { children: ReactNode }) => {
  return (
    <ul className="list-disc ml-4 flex flex-col gap-1 my-2">{children}</ul>
  );
};

const WikiListItem = ({ children }: { children: ReactNode }) => {
  return <li className="text-foreground leading-6">{children}</li>;
};

const WikiPageLink = ({ page }: { page: WikiPage }) => {
  return (
    <Link
      className="text-link font-medium underline"
      to={`/wiki/${page.slug}`}
    >
      {page.title}
    </Link>
  );
};

type WikiScreenshotProps = {
  base: string;
  alt: string;
  caption: string;
};

const WikiScreenshot = ({ base, alt, caption }: WikiScreenshotProps) => {
  const { uiColorScheme } = use(CookieContext);
  const { timestamp } = screenshotsData;

  return (
    <figure className="flex flex-col gap-2">
      <picture>
        <source
          srcSet={`/landing/${base}-${uiColorScheme}-${timestamp}.avif`}
          type="image/avif"
        />
        <img
          alt={alt}
          className="block w-full rounded-md border border-border"
          height={2100}
          loading="lazy"
          src={`/landing/${base}-${uiColorScheme}-${timestamp}.jpg`}
          width={1170}
        />
      </picture>
      <figcaption className="text-sm leading-5 text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
};

export const wikiPages = [
  {
    slug: 'introduction',
    title: 'Introduction',
    summary:
      'What Pillage First! is, what you are aiming for, and how it plays.',
    Content: ({ page }) => (
      <WikiArticle title={page.title}>
        <WikiSection title="What is Pillage First!?">
          <Text>
            Pillage First! (Ask Questions Later) is an open-source,
            single-player strategy game heavily inspired by Travian. You start
            with a small village, turn it into an economy, train troops and then
            decide whether your neighbours are trading partners or future loot.
          </Text>
          <Text>
            The whole game runs on your device. Your saves are yours, the game
            keeps working offline, and there are no ads, subscriptions or
            pay-to-win shortcuts.
          </Text>
        </WikiSection>
        <WikiSection title="What is the goal?">
          <Text>
            There is no single match timer or hard win condition. Pillage First!
            is about long-form progression: growing villages, expanding across
            the map, building an army, completing quests, sending your hero on
            adventures and pushing your economy until the world bends around it.
          </Text>
          <Text>
            You can play carefully and build a beautiful production machine, or
            lean into the name and start raiding early. The game gives you the
            systems; your priorities decide the shape of the run.
          </Text>
        </WikiSection>
      </WikiArticle>
    ),
  },
  {
    slug: 'interactions',
    title: 'Interactions',
    summary:
      'Clicks, long presses, queue controls and the small shortcuts worth knowing.',
    Content: ({ page }) => (
      <WikiArticle title={page.title}>
        <WikiSection title="Village map interactions">
          <Text>
            The village map is built for quick repeated actions. Clicking or
            tapping a building opens its detail page. Clicking an empty building
            field opens the construction screen, where you pick the building
            type for that slot.
          </Text>
          <Text>
            On large screens, hovering a building shows the upgrade control when
            that building can be upgraded. On touch layouts, press and hold an
            occupied building for one second to start the next upgrade directly.
            A normal tap still opens the building detail page.
          </Text>
          <WikiScreenshot
            alt="Village view with building fields"
            base="image-2"
            caption="The village view is where most direct building interactions happen."
          />
        </WikiSection>
        <WikiSection title="Construction controls">
          <Text>
            Building detail pages show costs, duration, requirements and
            available actions. Use them when you want to inspect the next level
            before committing resources. Use the long press shortcut when you
            already know the upgrade is the next thing you want.
          </Text>
          <Text>
            If the field is already busy, starting another level does not begin
            immediately. It becomes scheduled construction instead and waits
            behind the current construction for that field.
          </Text>
          <WikiScreenshot
            alt="Building details view"
            base="image-4"
            caption="Building pages are the safer place to check costs and requirements before constructing or upgrading."
          />
        </WikiSection>
        <WikiSection title="Queue interactions">
          <Text>
            The construction queue shows active construction first and scheduled
            construction after it. Active construction displays a countdown.
            Scheduled construction displays as In queue until it can become
            active.
          </Text>
          <Text>
            Scheduled construction can be cancelled. It can also be reordered by
            dragging its grip in the construction queue. The queue will reject
            orders that would build levels for the same field out of order.
          </Text>
        </WikiSection>
      </WikiArticle>
    ),
  },
  {
    slug: 'game-worlds',
    title: 'Game worlds',
    summary: 'How saves, world speed, map size and persistence work.',
    Content: ({ page }) => (
      <WikiArticle title={page.title}>
        <WikiSection title="What is a game world?">
          <Text>
            A game world is a single persistent map. When you create one, the
            game generates tiles, oases, NPC players and their starting villages
            from the settings you picked. That layout stays stable for the life
            of the world.
          </Text>
          <Text>
            Each world has its own clock, speed and save data. You can keep
            multiple worlds around at the same time without them interfering
            with each other.
          </Text>
        </WikiSection>
        <WikiSection title="Where is it stored?">
          <Text>
            Game worlds are local saves stored on your device. You can export a
            world to a file, import it later, or move it to another device. If
            you close the tab or lose connection, your progress does not vanish.
          </Text>
        </WikiSection>
        <WikiSection title="Speed matters">
          <Text>
            World speed changes how quickly construction, training, hero
            adventures and troop movements finish. Faster worlds compress the
            waiting. Slower worlds make each decision feel more deliberate.
          </Text>
        </WikiSection>
      </WikiArticle>
    ),
  },
  {
    slug: 'villages',
    title: 'Villages',
    summary: 'The home base for resources, buildings, troops and expansion.',
    Content: ({ page }) => (
      <WikiArticle title={page.title}>
        <WikiSection title="Your first village">
          <Text>
            Your village is the centre of your run. It produces resources,
            houses your population, trains troops and unlocks most of the
            decisions you make every session.
          </Text>
          <Text>
            A village has resource fields around it and building slots inside
            it. Resource fields improve production. Buildings unlock actions,
            storage, training, research, celebrations, expansion and defensive
            options.
          </Text>
          <WikiScreenshot
            alt="Village view"
            base="image-2"
            caption="The village view shows building slots, resource fields and active construction state at a glance."
          />
        </WikiSection>
        <WikiSection title="Expansion">
          <Text>
            One village can become strong, but a network of villages is
            stronger. Expansion lets you specialise: one village can feed
            troops, another can push infrastructure, and another can sit close
            to targets you care about.
          </Text>
        </WikiSection>
      </WikiArticle>
    ),
  },
  {
    slug: 'resources',
    title: 'Resources',
    summary: 'Wood, clay, iron and crop production, storage and upkeep.',
    Content: ({ page }) => (
      <WikiArticle title={page.title}>
        <WikiSection title="The four resources">
          <Text>
            Wood, clay, iron and crop drive almost everything. Buildings,
            research and troops all ask for a mix of resources, so a good
            village is not only about producing more; it is about producing the
            right thing for the next bottleneck.
          </Text>
        </WikiSection>
        <WikiSection title="Storage and crop">
          <Text>
            Warehouses and granaries decide how much you can hold. Crop is also
            tied to upkeep, so population and troops can make your economy feel
            tight even when the other resources look healthy.
          </Text>
        </WikiSection>
        <WikiSection title="Production overview">
          <Text>
            The production overview helps you compare villages quickly. Use it
            when you need to spot the weak village, pick the next upgrade, or
            decide where new troops should be trained.
          </Text>
          <WikiScreenshot
            alt="Resources view"
            base="image-1"
            caption="The resources view is the fastest way to see whether the village economy can pay for your next plan."
          />
        </WikiSection>
      </WikiArticle>
    ),
  },
  {
    slug: 'buildings',
    title: 'Buildings',
    summary: 'What buildings unlock and how village construction is paced.',
    Content: ({ page }) => (
      <WikiArticle title={page.title}>
        <WikiSection title="Building slots">
          <Text>
            Buildings turn a village from a resource pile into a working base.
            Some buildings are economic, some military, and some exist to unlock
            specific systems like research, trade, demolition or expansion.
          </Text>
          <WikiScreenshot
            alt="Building view"
            base="image-4"
            caption="Building pages show the current level, next upgrade costs, benefits and construction actions."
          />
        </WikiSection>
        <WikiSection title="Queues">
          <Text>
            Construction takes time, and the queue is one of the main pacing
            systems. The Main Building improves construction speed and gives you
            better control over the village as it grows.
          </Text>
        </WikiSection>
        <WikiSection title="Scheduled construction">
          <Text>
            Scheduled construction is created when you start a building level on
            a field that already has construction queued. The current level
            stays active, and the extra level waits behind it as an In queue
            entry.
          </Text>
          <Text>
            This lets you plan several levels for the same field without coming
            back exactly when the current timer finishes. Scheduled entries can
            be cancelled from the construction queue. They can also be dragged
            to reorder them, as long as the order still keeps each building
            field's levels increasing correctly.
          </Text>
        </WikiSection>
      </WikiArticle>
    ),
  },
  {
    slug: 'troops',
    title: 'Troops',
    summary: 'Training units, moving them, raiding and reinforcing.',
    Content: ({ page }) => (
      <WikiArticle title={page.title}>
        <WikiSection title="Training">
          <Text>
            Troops are trained from village buildings. Infantry, cavalry and
            special units all have different costs, speeds and battlefield
            roles. A useful army is usually planned around what you want it to
            do, not just what happens to be cheap.
          </Text>
        </WikiSection>
        <WikiSection title="Movement">
          <Text>
            Troops can attack, raid, reinforce, return home, relocate and found
            new villages. Travel time depends on the units involved, the target
            and the world speed.
          </Text>
        </WikiSection>
      </WikiArticle>
    ),
  },
  {
    slug: 'hero',
    title: 'Hero',
    summary: 'Hero attributes, inventory, adventures and revival.',
    Content: ({ page }) => (
      <WikiArticle title={page.title}>
        <WikiSection title="What the hero does">
          <Text>
            The hero is your named unit. They gain attributes, carry equipment,
            go on adventures and help shape the early game before your regular
            army is large enough to solve every problem.
          </Text>
        </WikiSection>
        <WikiSection title="Adventures and items">
          <Text>
            Adventures turn time into rewards and risk. Items from the hero
            inventory can improve production, combat, movement or survivability,
            depending on what you find and equip.
          </Text>
        </WikiSection>
      </WikiArticle>
    ),
  },
  {
    slug: 'map',
    title: 'Map',
    summary: 'Tiles, oases, NPC villages, markers and scouting targets.',
    Content: ({ page }) => (
      <WikiArticle title={page.title}>
        <WikiSection title="Reading the map">
          <Text>
            The map shows the world around your villages: empty tiles, occupied
            villages, oases, artifacts and targets worth remembering. The map is
            also where many troop actions start.
          </Text>
          <WikiScreenshot
            alt="Map view"
            base="image-3"
            caption="The map is where you inspect nearby villages, oases and useful targets."
          />
        </WikiSection>
        <WikiSection title="Oases and markers">
          <Text>
            Oases can matter for production, animals and expansion planning.
            Markers and filters help you keep the useful targets visible when
            the map starts getting crowded.
          </Text>
        </WikiSection>
      </WikiArticle>
    ),
  },
  {
    slug: 'quests',
    title: 'Quests',
    summary: 'Guided progression, rewards and early-game direction.',
    Content: ({ page }) => (
      <WikiArticle title={page.title}>
        <WikiSection title="Why quests exist">
          <Text>
            Quests give structure without forcing one exact build order. They
            point you toward important systems and reward you for making steady
            progress.
          </Text>
        </WikiSection>
        <WikiSection title="Collecting rewards">
          <Text>
            Quest rewards are often best used to push through the next
            bottleneck. If a reward gives resources, check your storage before
            collecting it so you do not waste the overflow.
          </Text>
        </WikiSection>
      </WikiArticle>
    ),
  },
  {
    slug: 'reports',
    title: 'Reports',
    summary: 'Battle, movement and event history you can review later.',
    Content: ({ page }) => (
      <WikiArticle title={page.title}>
        <WikiSection title="What reports show">
          <Text>
            Reports are the record of important things that happened: combat,
            raids, losses, gains and other outcomes that are easy to miss if you
            only look at the village after the fact.
          </Text>
        </WikiSection>
        <WikiSection title="Why they matter">
          <Text>
            A report tells you whether a plan worked. Use it to compare targets,
            spot expensive mistakes, and decide whether the next visit should be
            larger, smaller or never happen again.
          </Text>
        </WikiSection>
      </WikiArticle>
    ),
  },
] satisfies WikiPage[];

export const getWikiPageBySlug = (slug: string | undefined) => {
  return wikiPages.find((page) => page.slug === slug);
};

export const WikiIndexContent = () => {
  return (
    <WikiArticle title="Wiki">
      <WikiSection title="Topics">
        <Text>
          New to Pillage First!? Start with the introduction and work down the
          list. Each page is short on purpose; the wiki should explain the game,
          not become the game.
        </Text>
        <WikiList>
          {wikiPages.map((page) => (
            <WikiListItem key={page.slug}>
              <WikiPageLink page={page} /> - {page.summary}
            </WikiListItem>
          ))}
        </WikiList>
      </WikiSection>
      <WikiSection title="Feature screenshots">
        <Text>
          Screenshots are included on individual feature pages where seeing the
          screen helps more than another paragraph. Start with Villages,
          Resources, Buildings and Map for the most visual parts of the game.
        </Text>
      </WikiSection>
      <WikiSection title="Contributing">
        <Text>
          The wiki is open-source, just like the rest of the game. If something
          is missing, wrong or awkwardly explained, open an issue or send a pull
          request against the repository.
        </Text>
      </WikiSection>
    </WikiArticle>
  );
};
