import React, { useState } from 'react';
import clsx from 'clsx';

type ToggleProps = {
  id: string;
  onChange: () => void;
  label?: string;
  checked?: boolean;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const Toggle: React.FC<ToggleProps> = (props) => {
  const {
    id,
    onChange,
    label = '',
    checked = false,
    className = ''
  } = props;

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
      />
      <label
        htmlFor={id}
        className={clsx(isChecked ? 'bg-blue-500' : 'bg-gray-300', className, 'toggle-label relative block h-6 w-12 cursor-pointer rounded-full ease-out')}
      >
        {label}
      </label>
    </>
  );
};
