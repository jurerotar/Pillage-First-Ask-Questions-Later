CREATE TRIGGER reports_prune_oldest_before_insert
BEFORE INSERT ON reports
BEGIN
  DELETE FROM reports
  WHERE id IN (
    SELECT r.id
    FROM reports r
    WHERE NOT EXISTS (
      SELECT 1 FROM report_tags
      WHERE report_id = r.id
        AND report_tag_id = (SELECT id FROM report_tag_ids WHERE tag = 'archived')
    )
    ORDER BY r.timestamp, r.id
    LIMIT (
      SELECT CASE
        WHEN total < 1000 THEN 0
        ELSE MAX(
          -- Count the archive once, and only when pruning might be needed.
          total - (
            SELECT COUNT(*)
            FROM report_tags rt
            JOIN reports archived ON archived.id = rt.report_id
            WHERE rt.report_tag_id = (SELECT id FROM report_tag_ids WHERE tag = 'archived')
          ) - 999,
          0
        )
      END
      FROM (SELECT COUNT(*) AS total FROM reports)
    )
  );
END;
