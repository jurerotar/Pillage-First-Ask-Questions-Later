CREATE TRIGGER reports_prune_oldest_before_insert
BEFORE INSERT ON reports
BEGIN
  DELETE FROM reports
  WHERE id IN (
    SELECT r.id
    FROM reports r
    WHERE NOT EXISTS (
      SELECT 1
      FROM report_tags rt
      WHERE rt.report_id = r.id
        AND EXISTS (
          SELECT 1
          FROM report_tag_ids
          WHERE id = rt.report_tag_id
            AND tag = 'archived'
        )
    )
    ORDER BY r.timestamp, r.id
    LIMIT MAX(
      (
        SELECT COUNT(*)
        FROM reports counted_report
        WHERE NOT EXISTS (
          SELECT 1
          FROM report_tags rt
          WHERE rt.report_id = counted_report.id
            AND EXISTS (
              SELECT 1
              FROM report_tag_ids
              WHERE id = rt.report_tag_id
                AND tag = 'archived'
            )
        )
      ) - 999,
      0
    )
  );
END;
