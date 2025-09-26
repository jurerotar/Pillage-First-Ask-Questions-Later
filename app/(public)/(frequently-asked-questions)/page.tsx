import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';

const FrequentlyAskedQuestionsPage = () => {
  const { t } = useTranslation('public');

  const title = `${t('Frequently asked questions')} | Pillage First! (Ask Questions Later)`;

  return (
    <>
      <title>{title}</title>
      <main className="flex flex-col gap-4 max-w-3xl mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{t('Frequently asked questions')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Text as="h1">{t('Frequently asked questions')}</Text>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Text
              as="h2"
              className="underline"
            >
              What's the state of the project?
            </Text>
            <Text>
              Project is still pretty heavy in development! It's still missing a
              lot of major features. What's currently available is building
              construction, unit training, a couple of building interfaces, as
              well as secondary pages like production-overview,
              village-overview, preferences,...
              <br />
              <br />
              I'm currently working on a rework of the game engine. This rework
              will allow us to scale properly, which we need to simulate
              thousands of villages. This work is sadly taking the majority of
              my time, so other features are currently blocked due to that.
            </Text>
          </div>
          <div className="flex flex-col gap-2">
            <Text
              as="h2"
              className="underline"
            >
              Is there a project roadmap available?
            </Text>
            <Text>
              Due to the nature of this project (I get work on it only in my
              free time), I'm not willing to commit to any specific timeline for
              any features. That being said, here's the general plan for
              upcoming development:
            </Text>
            <ul className="pl-4 list-disc my-2">
              <li>
                <Text>Engine rework (currently in development)</Text>
              </li>
              <li>
                <Text>Combat mechanics</Text>
              </li>
              <li>
                <Text>Trading mechanics</Text>
              </li>
              <li>
                <Text>Hero adventures, inventory,...</Text>
              </li>
            </ul>
            <Text>
              Bug fixing and other minor works will be made between these
              features.
            </Text>
          </div>
          <div className="flex flex-col gap-2">
            <Text
              as="h2"
              className="underline"
            >
              Are there game design differences between Travian and Pillage
              First!?
            </Text>
            <Text>
              Yes, there are a few! The main ones include new buildings,
              additional playable tribes, the removal of the capital village
              mechanic, and new hero items. Game design is an ongoing
              conversation in{' '}
              <a
                rel="noopener noreferrer"
                className="text-blue-500 underline"
                target="_blank"
                href="https://discord.gg/Ep7NKVXUZA"
              >
                our Discord server
              </a>
              , so feel free to hop in and share your thoughts!
            </Text>
          </div>
          <div className="flex flex-col gap-2">
            <Text
              as="h2"
              className="underline"
            >
              Why single-player?
            </Text>
            <Text>
              There are a few key reasons I chose to focus on single-player:
            </Text>
            <ul className="pl-4 list-disc my-2">
              <li>
                <Text>
                  <b>Moderation cost & complexity</b> - multiplayer comes with a
                  whole layer of moderation challenges — things like chat
                  filters, reporting tools, cheat prevention, and account
                  systems. They’re not just one-time features either; they need
                  constant upkeep and care. For a solo developer, that’s a
                  massive investment of time and energy that could easily
                  overshadow the actual game development. With single-player, I
                  can skip all of that and stay focused on building the
                  experience itself.
                </Text>
              </li>
              <li>
                <Text>
                  <b>Offline-first accessibility</b> - by skipping networking,
                  the game becomes fully playable offline. This makes it more
                  accessible to players with limited or unreliable internet
                  access, and ensures the experience is consistent regardless of
                  connection quality.
                </Text>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Text
              as="h2"
              className="underline"
            >
              Can this project be converted to multiplayer?
            </Text>
            <Text>
              <b>Yes!</b> This project was actually rebuilt from the ground up
              to make it as compatible as possible with a potential backend
              integration.
              <br />
              <br />
              That being said, the current goal is to keep this repository as a{' '}
              <b>standalone</b>, <b>offline-first</b> app focused on{' '}
              <b>single-player</b> gameplay.
              <br />
              <br />
              One of the hopes for the future of this project is that someone
              might eventually fork the project, restructure it, and connect it
              to a backend, enabling a multiplayer experience. Most of the
              frontend can be completely reused, making the transition easier
              than starting from scratch.
              <br />
              <br />
              If you’re passionate about backend development and want to help
              bring multiplayer to life — feel free to reach out!
            </Text>
          </div>
          <div className="flex flex-col gap-2">
            <Text
              as="h2"
              className="underline"
            >
              Does the game continue even if I close the app?
            </Text>
            <Text>
              <b>Yes!</b> You're free to close the app at any time and the game
              will pick off right the next time you open it again! Units will
              continue to be trained, building will continue to be constructed
              and troops will continue to raid.
            </Text>
          </div>
          <div className="flex flex-col gap-2">
            <Text
              as="h2"
              className="underline"
            >
              How does the game continue running if the app is closed?
            </Text>
            <Text>
              In a nutshell, whenever you open a game world, we simulate every
              event that would have taken place, had the app been open all this
              time. These events would happened at some time in the past, but
              since app can't run without the browser being open, we resolve
              these events now. This means you can be attacked while offline,
              since this attack would also have happened if you were online. The
              major downside is that we can't know which events have happened
              until we actually open the game world and simulate the timeline.
              This means we can't let the player know if they're under attack,
              because the only way for us to know whether an attack has been
              triggered is to actually open the game.
            </Text>
          </div>
          <div className="flex flex-col gap-2">
            <Text
              as="h2"
              className="underline"
            >
              Why not stick with the original?
            </Text>
            <Text>
              While I love Travian, I (and many more like me) just don't have
              the time to commit to it anymore. Pulling all-nighters, finding
              duals from across the world and making sure account is covered
              24/7 was fun in middle school, but it's not something I want to
              (or even can?) engage in now. I want to be able to take a break,
              whenever life gets in the way, and for the game to respect that. I
              want this game to be a more accessible, customizable and
              time-friendly version of Travian.
            </Text>
          </div>
        </div>
      </main>
    </>
  );
};

export default FrequentlyAskedQuestionsPage;
