CREATE TRIGGER reports_delete_details_before_delete
BEFORE DELETE ON reports
BEGIN
  DELETE FROM movement_report_units
  WHERE movement_report_id IN (
    SELECT id FROM movement_reports WHERE report_id = OLD.id
  );

  DELETE FROM hero_adventure_reports WHERE report_id = OLD.id;
  DELETE FROM movement_reports WHERE report_id = OLD.id;
  DELETE FROM trade_reports WHERE report_id = OLD.id;
END;
