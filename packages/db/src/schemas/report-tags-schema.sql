CREATE TABLE report_tags
(
  report_id INTEGER NOT NULL,
  report_tag_id INTEGER NOT NULL,

  PRIMARY KEY (report_id, report_tag_id),

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (report_tag_id) REFERENCES report_tag_ids (id) ON DELETE CASCADE
) STRICT;
