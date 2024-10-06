import { Icon, type IconType, typeToIconMap } from 'app/components/icon';
import { chunk } from 'moderndash';
import type React from 'react';

const iconNames = Object.keys(typeToIconMap) as IconType[];
const chunkedIconNames = chunk(iconNames, Math.trunc(iconNames.length / 5));

const IconsPage: React.FC = () => {
  return (
    <>
      <main className="flex flex-col">
        <section className="container relative mx-auto py-4">
          <ul className="flex flex-col md:flex-row justify-between">
            {chunkedIconNames.map((chunk, i) => (
              <ul
                className="flex flex-col gap-1"
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
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
