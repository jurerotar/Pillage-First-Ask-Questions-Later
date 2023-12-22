# App directory naming convention

`[xxx]` - Folders marked with square brackets `[]` indicate a group. Folders are usually marked in this manner for separation/readability purposes only, where name of the folder is not used in url pathname.
  * Example: [public]/_page -> /page

`_xxx` - Folders marked with an underline indicate an url pathname, either for a group of pages or a single page.
  * Example: _group/_page -> /group/page

`xxx` - Folder without any special markers are used for code that belongs to that specific group or pages.
  * Example: _group/components -> components which are only used in this specific group

`loader`, `error-boundary`, `skeleton`, `layout`, `page` - Reserved file names that may exist on each group or page level.
