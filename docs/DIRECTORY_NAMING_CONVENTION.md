# App directory naming convention

`[xxx]` - Folders marked with square brackets `[]` indicate a group. You may encounter additional `/components`, `/hooks`,... sub-folders, where the code in these folders is only used in this particular group.
  * Example: [public]/page -> /page

`xxx` - Folder without any special markers are used for code that belongs to that specific group or pages.
  * Example: [group]/components -> components which are only used in this specific group

`loader`, `error-boundary`, `skeleton`, `layout`, `page` - Reserved file names that may exist on each group or page level.
