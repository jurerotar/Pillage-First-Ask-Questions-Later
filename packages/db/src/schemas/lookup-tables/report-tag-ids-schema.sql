CREATE TABLE report_tag_ids
(
  id INTEGER PRIMARY KEY,
  tag TEXT NOT NULL UNIQUE CHECK (tag IN ('read', 'archived'))
) STRICT;
