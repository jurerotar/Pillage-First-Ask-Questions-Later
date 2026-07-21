CREATE TABLE report_outcome_ids
(
    id INTEGER PRIMARY KEY,
    report_outcome TEXT NOT NULL UNIQUE CHECK (report_outcome IN (
        'attackerNoLoss',
        'attackerSomeLoss',
        'attackerFullLoss',
        'defenderNoLoss',
        'defenderSomeLoss',
        'defenderFullLoss',
        'scoutAttackerNoLoss',
        'scoutAttackerSomeLoss',
        'scoutAttackerFullLoss',
        'scoutDefenderNoLoss',
        'scoutDefenderSomeLoss',
        'scoutDefenderFullLoss',
        'outgoingMerchantsArrived',
        'incomingMerchantsArrived',
        'heroAdventure',
        'troopMovement',
        'huntingParty',
        'gatheringExpedition'
    ))
) STRICT;
