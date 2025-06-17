import { Button } from 'app/components/ui/button';
import { Icon } from 'app/components/icon';
import type React from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import styles from './horse.module.scss';

const HorseColorPicker = () => {
  const svgIds = [
    'base',
    'eye_1_',
    'neck-front_1_',
    'muzzle_1_',
    'mane-front_1_',
    'mane-back_1_',
  ];

  // State for selected ID and color map
  const [selectedId, setSelectedId] = useState(svgIds[0]); // default to first id
  const [colors, setColors] = useState(
    Object.fromEntries(svgIds.map((e) => [e, 'black'])),
  );

  // Handle changes in the dropdown
  const handleIdChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSelectedId(event.target.value);
  };

  // Handle color input changes
  const handleColorChange = (event: { target: { value: string } }) => {
    const newColor = event.target.value;
    setColors((prevColors) => ({
      ...prevColors,
      [selectedId]: newColor,
    }));
  };

  const copyColors = async () => {
    await navigator.clipboard.writeText(
      `@include horseIconColorSet(${Object.values(colors).join(', ')})`,
    );
  };

  return (
    <div className="flex">
      <div className="size-80">
        <Icon
          type="paladin"
          className={styles.horse}
          style={{
            // @ts-ignore
            '--base-color': colors.base,
            '--eye-color': colors.eye_1_,
            '--neck-front-color': colors['neck-front_1_'],
            '--muzzle-color': colors.muzzle_1_,
            '--mane-front-color': colors['mane-front_1_'],
            '--mane-back-color': colors['mane-back_1_'],
          }}
        />
      </div>
      <div className="flex flex-col gap-4">
        <label>
          Select element:
          <select
            value={selectedId}
            onChange={handleIdChange}
          >
            {svgIds.map((id) => (
              <option
                key={id}
                value={id}
              >
                {id}
              </option>
            ))}
          </select>
        </label>

        <label>
          Choose Color:
          <input
            type="color"
            onChange={handleColorChange}
          />
        </label>
        <Button onClick={copyColors}>Copy color selection</Button>
      </div>
    </div>
  );
};

type Param = 'pathfinder';

type ParamToComponentMap = Record<Param, () => React.JSX.Element>;

const paramToComponentMap: ParamToComponentMap = {
  pathfinder: HorseColorPicker,
};

const ColorPickerPage = () => {
  const [searchParams] = useSearchParams();

  const name = searchParams.get('name')!;

  const Component = paramToComponentMap[name as Param] ?? null;

  return (
    <>
      <main className="flex flex-col">
        <section className="container relative mx-auto py-4 flex">
          <Component />
        </section>
      </main>
    </>
  );
};

export default ColorPickerPage;
