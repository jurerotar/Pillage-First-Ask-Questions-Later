CREATE TRIGGER reports_delete_details_before_delete
BEFORE DELETE ON reports
BEGIN
  DELETE FROM report_tags WHERE report_id = OLD.id;

  DELETE FROM scouting_report_units WHERE scouting_report_id IN (SELECT id FROM scouting_reports WHERE report_id = OLD.id);
  DELETE FROM scouting_report_attacker_units WHERE scouting_report_id IN (SELECT id FROM scouting_reports WHERE report_id = OLD.id);
  DELETE FROM scouting_report_structures WHERE scouting_report_id IN (SELECT id FROM scouting_reports WHERE report_id = OLD.id);

  DELETE FROM battle_report_units
  WHERE battle_participant_id IN (
    SELECT bp.id
    FROM battle_report_participants bp
    JOIN battle_reports b ON b.id = bp.battle_id
    WHERE b.report_id = OLD.id
  );

  DELETE FROM battle_report_participants
  WHERE battle_id IN (
    SELECT id FROM battle_reports WHERE report_id = OLD.id
  );

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
  DELETE FROM battle_reports WHERE report_id = OLD.id;
  DELETE FROM hunting_party_reports WHERE report_id = OLD.id;
  DELETE FROM gathering_expedition_reports WHERE report_id = OLD.id;
  DELETE FROM scouting_reports WHERE report_id = OLD.id;
END;
