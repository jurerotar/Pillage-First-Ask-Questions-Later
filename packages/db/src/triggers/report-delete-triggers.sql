CREATE TRIGGER reports_delete_details_before_delete
BEFORE DELETE ON reports
BEGIN
  DELETE FROM movement_report_units
  WHERE movement_report_id IN (
    SELECT id FROM movement_reports WHERE report_id = OLD.id
  );

  DELETE FROM hunting_party_report_units
  WHERE hunting_party_report_id IN (
    SELECT id FROM hunting_party_reports WHERE report_id = OLD.id
  );

  DELETE FROM gathering_expedition_report_units
  WHERE gathering_expedition_report_id IN (
    SELECT id FROM gathering_expedition_reports WHERE report_id = OLD.id
  );

  DELETE FROM hero_adventure_reports WHERE report_id = OLD.id;
  DELETE FROM movement_reports WHERE report_id = OLD.id;
  DELETE FROM trade_reports WHERE report_id = OLD.id;
  DELETE FROM hunting_party_reports WHERE report_id = OLD.id;
  DELETE FROM gathering_expedition_reports WHERE report_id = OLD.id;
END;
