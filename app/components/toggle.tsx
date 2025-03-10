import clsx from 'clsx';
import type React from 'react';
import { useState } from 'react';

type ToggleProps = {
  id: string;
  onChange: () => void;
  label?: string;
  checked?: boolean;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const Toggle: React.FC<ToggleProps> = (props) => {
  const { id, onChange, label = '', checked = false, className = '', ...rest } = props;

  const [isChecked, setIsChecked] = useState<boolean>(checked);

  const toggle = () => {
    onChange();
    setIsChecked((prev) => !prev);
  };

  return (
    <>
      <input
        type="checkbox"
        className="toggle-checkbox hidden"
        checked={isChecked}
        id={id}
        aria-label={label}
        onChange={toggle}
        {...rest}
      />
      <label
        htmlFor={id}
        className={clsx(
          isChecked ? 'bg-green-500' : 'bg-gray-300',
          className,
          'toggle-label relative block h-6 max-w-12 w-full cursor-pointer rounded-full ease-out',
        )}
      >
        <span
          className={clsx(
            'absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform',
            isChecked ? 'translate-x-6' : 'translate-x-0',
          )}
        />
        {label}
      </label>
    </>
  );
};
