import { Link } from 'react-router';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';

const HomePage = () => {
  return (
    <>
      <title>Pillage First! (Ask Questions Later)</title>
      <main className="flex flex-col">
        <div className="container relative mx-auto flex min-h-[300px] flex-col lg:flex-row gap-2 px-2 justify-center items-center">
          <section className="flex flex-col flex-1 gap-4 justify-center">
            <Text
              as="h1"
              className="font-semibold"
            >
              Pillage First! (Ask Questions Later)
            </Text>
            <Text>
              <b>Pillage First!</b> is an <b>open-source</b>,{' '}
              <b>single-player</b> strategy game <b>inspired by Travian</b>.
            </Text>
            <Text>
              <b>Build villages</b>, <b>manage resources</b>,{' '}
              <b>train troops</b>, and wage war in persistent, massive,{' '}
              <b>offline-first</b> game worlds. It requires no account or
              download.
            </Text>

            <div className="flex gap-2">
              <Link to="/create-new-game-world">
                <Button>Try now</Button>
              </Link>
              <Link to="/my-game-worlds">
                <Button variant="outline">Existing game worlds</Button>
              </Link>
              {/*<a*/}
              {/*  href="https://discord.gg/Ep7NKVXUZA"*/}
              {/*  rel="noopener"*/}
              {/*  className="flex items-center justify-center gap-2 rounded-full bg-[#7289da] w-fit shadow-md p-2 px-4"*/}
              {/*>*/}
              {/*  <FaDiscord className="text-2xl md:text-3xl text-white" />*/}
              {/*  <span className="flex font-semibold text-white">*/}
              {/*    Join the Discord server*/}
              {/*  </span>*/}
              {/*</a>*/}
              {/*<a*/}
              {/*  href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"*/}
              {/*  className="flex items-center justify-center gap-2 rounded-full bg-[#24292e] w-fit shadow-md p-2 px-4"*/}
              {/*>*/}
              {/*  <FaGithub className="text-2xl md:text-3xl text-white" />*/}
              {/*  <span className="flex font-semibold text-white">*/}
              {/*    Star on GitHub*/}
              {/*  </span>*/}
              {/*</a>*/}
            </div>
          </section>
          <section className="flex flex-1" />
        </div>
      </main>
    </>
  );
};

export default HomePage;
