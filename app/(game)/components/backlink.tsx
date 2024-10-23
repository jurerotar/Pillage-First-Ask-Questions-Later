import { IoIosArrowBack } from 'react-icons/io';
import { Link } from 'react-router-dom';

export const Backlink = () => {
  return (
    <Link
      viewTransition
      to=".."
      className="flex items-center gap-1"
    >
      <IoIosArrowBack className="mt-[2px]" />
      <span className="">Back</span>
    </Link>
  );
};
