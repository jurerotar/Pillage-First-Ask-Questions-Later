import { IoIosArrowBack } from 'react-icons/io';
import { Link } from 'react-router';

export const Backlink = () => {
  return (
    <Link
      to=".."
      className="flex items-center gap-1"
      relative="path"
    >
      <IoIosArrowBack className="mt-[2px]" />
      <span className="">Back</span>
    </Link>
  );
};
