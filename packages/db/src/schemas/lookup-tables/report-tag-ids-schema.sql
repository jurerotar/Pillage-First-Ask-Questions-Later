CREATE TABLE report_tag_ids
(
  id INTEGER PRIMARY KEY,
  tag TEXT NOT NULL UNIQUE CHECK (tag IN ('READ', 'ARCHIVED'))
) STRICT;

CREATE INDEX idx_report_tags_ids_tag ON report_tag_ids(tag);
