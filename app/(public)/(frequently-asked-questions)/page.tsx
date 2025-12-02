import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';

const FrequentlyAskedQuestionsPage = () => {
  const { t } = useTranslation('public');

  const title = t('{{title}} | Pillage First!', {
    title: 'Frequently asked questions',
  });

  return (
    <>
      <title>{title}</title>
      <div className="flex flex-col gap-4 max-w-3xl px-2 lg:px-0 mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">{t('Home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{t('Frequently asked questions')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <main className="flex flex-col gap-4">
          <Text as="h1">{t('Frequently asked questions')}</Text>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Text as="h2">{t("What's the state of the project?")}</Text>
              <Text>
                Project is still pretty heavy in development! It's still missing
                a lot of major features. What's currently available is building
                construction, unit training, a couple of building interfaces, as
                well as secondary pages like production-overview,
                village-overview, preferences,...
                <br />
                <br />
                I'm currently working on a rework of the game engine. This
                rework will allow us to scale properly, which we need to
                simulate thousands of villages. This work is sadly taking the
                majority of my time, so other features are currently blocked due
                to that.
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text as="h2">{t('Is there a project roadmap available?')}</Text>
              <Text>
                Due to the nature of this project (I get work on it only in my
                free time), I'm not willing to commit to any specific timeline
                for any features. That being said, here's the general plan for
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
              <Text as="h2">
                {t(
                  'Are there game design differences between Travian and Pillage First!?',
                )}
              </Text>
              <Text>
                Yes, there are a few! The main ones include new buildings,
                additional playable tribes, the removal of the capital village
                mechanic, new hero items, reputation system with NPC players and
                plenty more! Game design is an ongoing conversation in{' '}
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
              <Text as="h2">{t('Why single-player?')}</Text>
              <Text>
                There are a few key reasons I chose to focus on single-player:
              </Text>
              <ul className="pl-4 list-disc my-2">
                <li>
                  <Text>
                    <b>Customizable gameplay</b> - Each of us has a different
                    expectation of the game. Some players prefer speedier game
                    worlds, some prefer more difficult opponents, while others
                    look for a more peaceful coexisting with their neighbors.
                    This isn't something that we can offer in a multiplayer
                    setting, where you have no control of other players'
                    actions. Thus, one of the goals of this app is to give you
                    the power to customize your gameplay as much as possible.
                    You'll be able to choose speed, difficulty (NPC troop
                    levels,...) and more at server creation form!
                  </Text>
                </li>
                <li>
                  <Text>
                    <b>Respecting your time</b> - Most of us are not in high
                    school anymore. Waking up at 3am to send out attacks may
                    have been a valid strategy 10 years ago, but its out of the
                    question now. Because we realize real-life takes priority,
                    we plan on adding multiple mechanism to help you balance
                    game needs:
                    <br />
                    Unlimited vacation mode, available at any point for any
                    reason
                    <br />
                    Ability to disable attacks while you're offline
                  </Text>
                </li>
                <li>
                  <Text>
                    <b>Moderation cost & complexity</b> - multiplayer comes with
                    a whole layer of moderation challenges, things like chat
                    filters, reporting tools, cheat prevention, account and
                    support systems. They're not just one-time features either;
                    they need constant upkeep and care. For a solo developer,
                    that's a massive investment of time and energy that could
                    easily overshadow the development of the actual game.
                    Single-player allows me to limit the scope of the project
                    and deliver faster.
                  </Text>
                </li>
                <li>
                  <Text>
                    <b>Offline-first</b> - One of the goals of this project is
                    to allows players to load the app once and then have it work
                    fully offline. This makes it more accessible to players with
                    limited or unreliable internet access, and ensures the
                    experience is consistent regardless of connection quality.
                  </Text>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <Text as="h2">
                {t('Can this project be converted to multiplayer?')}
              </Text>
              <Text>
                <b>Yes!</b> This project was actually rebuilt from the ground up
                to make it as compatible as possible with a potential backend
                integration.
                <br />
                <br />
                That being said, the current goal is to keep this repository as
                a <b>standalone</b>, <b>offline-first</b> app focused on{' '}
                <b>single-player</b> gameplay.
                <br />
                <br />
                One of the hopes for the future of this project is that someone
                might eventually fork the project, restructure it, and connect
                it to a backend, enabling a multiplayer experience. Most of the
                frontend can be completely reused, making the transition easier
                than starting from scratch.
                <br />
                <br />
                If you're passionate about backend development and want to help
                bring multiplayer to life, feel free to reach out!
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text as="h2">
                {t('Does the game continue even if I close the app?')}
              </Text>
              <Text>
                <b>Yes!</b> You're free to close the app at any time and the
                game will pick off right the next time you open it again! Units
                will continue to be trained, building will continue to be
                constructed and troops will continue to raid.
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text as="h2">
                {t(' How does the game continue running if the app is closed?')}
              </Text>
              <Text>
                In a nutshell, whenever you open a game world, we simulate every
                event that would have taken place, had the app been open all
                this time. These events would happened at some time in the past,
                but since app can't run without the browser being open, we
                resolve these events now. This means you can be attacked while
                offline, since this attack would also have happened if you were
                online.
                <br />
                The major downside is that we can't know which events have
                happened until we actually open the game world and simulate the
                timeline. This means we can't let the player know if they're
                under attack, because the only way for us to know whether an
                attack has been triggered is to actually open the game.
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text as="h2">{t('Why not stick with the original?')}</Text>
              <Text>
                While I love Travian, I (and many more like me) just don't have
                the time to commit to it anymore. Pulling all-nighters, finding
                duals from across the world and making sure account is covered
                24/7 was fun in middle school, but it's not something I want to
                (or even can?) engage in now. I want to be able to take a break,
                whenever life gets in the way, and for the game to respect that.
                <br />
                <br />I want this game to be a more accessible, customizable and
                time-friendly version of Travian.
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text as="h2">
                {t('Are game worlds stable between new releases?')}
              </Text>
              <Text>
                <b>Sometimes, but most often not.</b> Despite this project being
                developed in my free-time only, we still have a relatively high
                update cadency. Typically, we push out 3-5 (mostly minor)
                updates per week. Most of these updates are completely safe and
                don't affect the underlying data structures that the app
                requires, but not always. Sometimes, even minor changes break
                the game world, either completely, or partially.
                <br />
                <br />
                <b>Until full release</b> - Until the full release of the game,
                I don't intend to keep worlds compatible between changes. This
                means game worlds should be expected to break relatively
                regularly and should only be used for testing the game out. I
                can't afford to spend time migrating old game states to new
                structures to keep compatibility, due to this slowing down
                development quite a bit.
                <br />
                <br />
                <b>After full release</b> - After the game is officially
                released, I will commit to keeping game worlds stable between
                releases. This means that with each a game change, I'll also
                provide a script to migrate old game states to new ones. This
                process should be completely transparent to users.
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text
                as="h2"
                className="underline"
              >
                Is there an in-game Wiki available?
              </Text>
              <Text>
                Not yet, but I can (officially?) confirm there's one in the
                making!
                <br />
                <br />
                It's going to include units (cost, attack and defence upgrade
                tables and durations), buildings (cost, upgrade durations), hero
                (exp tables and revive cost) and some general advice and tips.
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text
                as="h2"
                className="underline"
              >
                Is 10x the highest supporter game world speed?
              </Text>
              <Text>
                Yes. This might get revised upwards in the future. The limiting
                factor here is players' own devices. Since the app runs 100% on
                your device, we can't really guarantee good performance. Higher
                speed game worlds require more device resources, and maxing
                these out could cause lag, excessive battery drain and other
                issues.
                <br />
                <br />A 10x speed appears stable even on lower-end devices,
                which is why this speed was determined to be the higher limit
                for now.
              </Text>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default FrequentlyAskedQuestionsPage;
