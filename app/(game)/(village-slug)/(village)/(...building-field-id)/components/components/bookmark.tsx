import { use } from 'react';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import { useBookmarks } from 'app/(game)/(village-slug)/hooks/use-bookmarks';
import { Button } from 'app/components/ui/button';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa6';

type BookmarkProps = {
  tab: string;
};

export const Bookmark = ({ tab }: BookmarkProps) => {
  const { buildingField } = use(BuildingFieldContext);
  const { bookmarks, updateBookmark } = useBookmarks();

  const buildingId = buildingField!.buildingId;

  const isSelected = bookmarks[buildingId] === tab;

  return (
    <Button
      variant="outline"
      className="absolute top-0 right-0"
      disabled={isSelected}
      onClick={() => updateBookmark({ buildingId, tab })}
    >
      {!isSelected && <FaRegBookmark className="size-4" />}
      {isSelected && <FaBookmark className="size-4 text-yellow-800" />}
    </Button>
  );
};
