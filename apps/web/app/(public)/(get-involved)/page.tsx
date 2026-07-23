import { useTranslation } from 'react-i18next';
import {
  FaComments,
  FaDiscord,
  FaGithub,
  FaPaintbrush,
  FaPeopleCarryBox,
  FaShareNodes,
  FaStar,
} from 'react-icons/fa6';
import { DiscordButton } from 'app/(public)/components/discord-button';
import { GithubContributorsPreview } from 'app/(public)/components/github-contributors-preview';
import { PageMetadata } from 'app/(public)/components/page-metadata';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Button } from 'app/components/ui/button';

const contributionSteps = [
  {
    title: 'Star on GitHub',
    description:
      'Help more developers discover the project and keep the repository visible.',
    action: {
      href: 'https://github.com/jurerotar/Pillage-First-Ask-Questions-Later',
      label: 'Star the repo',
      variant: 'default' as const,
    },
    icon: <FaStar />,
    meta: '30 seconds',
  },
  {
    title: 'Join Discord',
    description:
      'Say hello, tell us what you want to work on and get pointed toward current priorities.',
    action: {
      href: 'https://discord.gg/Ep7NKVXUZA',
      label: 'Join the server',
      variant: 'discord' as const,
    },
    icon: <FaDiscord />,
    meta: '2 minutes',
  },
  {
    title: 'Check active discussions',
    description:
      "Check #in-development to see what's currently being worked on, then check #ideas to see what we're discussing and let us know your thoughts.",
    icon: <FaComments />,
    meta: 'Current work',
  },
  {
    title: 'Propose ideas or give feedback',
    description:
      'Share new ideas, comment on existing proposals or give feedback on features already in the game.',
    icon: <FaPaintbrush />,
    meta: 'Shape the game',
  },
  {
    title: 'Pick a lane',
    description:
      'Choose what fits you, then let us know you want to help so we can assign you the right work.',
    icon: <FaPeopleCarryBox />,
    meta: 'Any skill level',
  },
  {
    title: 'Stay involved',
    description:
      'New features ship often. Help shape the experience by playtesting builds, suggesting improvements and staying active in the community.',
    icon: <FaComments />,
    meta: 'Repeatable',
  },
  {
    title: 'Share with your friends',
    description:
      'Sharing the project and bringing new people into the community is one of the best ways to help us out.',
    icon: <FaShareNodes />,
    meta: 'Spread the word',
  },
];

const GetInvolvedPage = () => {
  const { t } = useTranslation('public');

  const title = t('{{title}} | Pillage First!', { title: 'Get involved' });

  return (
    <PageContents>
      <PageMetadata
        title={title}
        description="Help build Pillage First! by contributing code or artwork, playtesting new features, sharing feedback or joining the open-source community."
      />
      <div className="flex flex-col gap-6 max-w-5xl px-2 lg:px-0 mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">{t('Home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{t('Get involved')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <main className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <section className="flex flex-col gap-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="flex flex-col gap-3">
              <Text
                as="h1"
                className="text-3xl font-medium leading-tight lg:text-5xl"
              >
                Help build Pillage First!
              </Text>
              <Text
                variant="muted"
                className="max-w-xl text-base"
              >
                You do not need to be an expert to contribute. Help is welcome
                across development, UI/UX, game design, testing and community
                feedback.
              </Text>
            </div>

            <Text>
              <strong>
                Pillage First! grows through code, feedback, testing and ideas
                from the community.
              </strong>
            </Text>
            <div className="grid gap-2 grid-cols-8 w-fit">
              <GithubContributorsPreview />
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
              >
                <Button className="inline-flex items-center gap-2">
                  <FaGithub className="size-4" />
                  Star on GitHub
                </Button>
              </a>
              <DiscordButton>Join Discord</DiscordButton>
            </div>
          </section>

          <section
            className="relative flex flex-col gap-4"
            aria-label="Contributor timeline"
          >
            <div
              className="absolute bottom-8 left-5 top-5 w-px bg-border md:left-6"
              aria-hidden
            />

            {contributionSteps.map((step, index) => {
              return (
                <article
                  key={step.title}
                  className="relative grid grid-cols-[2.75rem_1fr] gap-4 md:grid-cols-[3.25rem_1fr]"
                >
                  <div className="relative z-10 flex size-10 items-center justify-center rounded-full border border-border bg-background shadow-sm md:size-12">
                    <span className="size-4 text-foreground md:size-5 [&_svg]:size-full">
                      {step.icon}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors md:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-medium text-muted-foreground">
                            0{index + 1}
                          </span>
                          <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {step.meta}
                          </span>
                        </div>
                        <Text
                          as="h2"
                          className="text-xl font-semibold"
                        >
                          {step.title}
                        </Text>
                      </div>

                      {step.action && (
                        <a
                          rel="noopener noreferrer"
                          target="_blank"
                          href={step.action.href}
                          className="w-fit"
                        >
                          <Button
                            size="sm"
                            variant={step.action.variant}
                          >
                            {step.action.label}
                          </Button>
                        </a>
                      )}
                    </div>

                    <Text
                      variant="muted"
                      className="mt-3"
                    >
                      {step.description}
                    </Text>
                  </div>
                </article>
              );
            })}
          </section>
        </main>
      </div>
    </PageContents>
  );
};

export default GetInvolvedPage;
