import { chunk } from 'moderndash';
import { Icon } from 'app/components/icon';
import { type IconType, icons } from 'app/components/icons/icons';

const iconNames = Object.keys(icons) as IconType[];
const chunkedIconNames = chunk(iconNames, Math.trunc(iconNames.length / 5));

const IconsPage = () => {
  return (
    <>
      <title>Design system - Icons | Pillage First!</title>
      <main className="flex flex-col">
        <section className="container relative mx-auto py-4">
          <ul className="flex flex-col md:flex-row justify-between">
            {chunkedIconNames.map((chunk, i) => (
              <ul
                className="flex flex-col gap-1"
                // biome-ignore lint/suspicious/noArrayIndexKey: It's only rendered once and it never changes
                key={i}
              >
                {chunk.map((name: IconType) => (
                  <li
                    key={name}
                    className="flex gap-4"
                  >
                    <Icon
                      className="size-12"
                      type={name}
                    />
                    <p>{name}</p>
                  </li>
                ))}
              </ul>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
};

export default IconsPage;
