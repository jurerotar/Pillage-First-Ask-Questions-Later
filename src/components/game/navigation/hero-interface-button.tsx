import React, { ButtonHTMLAttributes } from 'react';
import { useWindowSize } from 'hooks/use-window-size';
import { useContextSelector } from 'use-context-selector';
import { HeroContext } from 'providers/game/hero-context';

type NavigationButtonProps = {
  onClick: () => void;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const heroHealthCircleCircumference = 2 * Math.PI * 50;
const heroExperienceCircleCircumference = 2 * Math.PI * 60;

const NavigationButton: React.FC<NavigationButtonProps> = (props) => {
  const {
    onClick
  } = props;

  const { width } = useWindowSize();
  const heroData = useContextSelector(HeroContext, (v) => v.heroData);
  const heroLevel = heroData!.level;
  const heroHealth = heroData!.health;
  const heroExperience = heroData!.experience;
  const requiredExperienceForNextLevel = heroLevel * 50 + 50;

  return (
    <button
      className="flex h-fit items-center justify-center rounded-full border-[6px] bg-white p-1"
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center justify-center">
        HI
      </span>
      <div className="fixed bottom-5 left-5 inline-flex items-center justify-center overflow-hidden rounded-full">
        <svg
          style={{
            transform: 'scaleX(-1)'
          }}
          className="h-[100px] w-[100px]"
        >
          <circle
            className="text-gray-300"
            strokeWidth="30"
            stroke="currentColor"
            fill="transparent"
            r="50"
            cx="50"
            cy="50"
          />
          <circle
            className="text-blue-600"
            strokeWidth="10"
            strokeDasharray={heroHealthCircleCircumference}
            strokeDashoffset={-heroHealthCircleCircumference - ((25) / 100) * heroHealthCircleCircumference}
            // strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="43"
            cx="50"
            cy="50"
          />
        </svg>
      </div>
    </button>
  );
};
