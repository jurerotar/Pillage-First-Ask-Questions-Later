import React, { useState } from 'react';

type ToggleProps = {
  id: string;
  onChange: () => void;
  label?: string;
  checked?: boolean;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Toggle: React.FC<ToggleProps> = (props): JSX.Element => {
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
        className={`toggle-label relative cursor-pointer block w-12 h-6 rounded-full transition-colors duration-default ease-out ${isChecked ? 'bg-blue-500' : 'bg-gray-300'} ${className}`}
      >
        {label}
      </label>
    </>
  );
};

export default Toggle;
